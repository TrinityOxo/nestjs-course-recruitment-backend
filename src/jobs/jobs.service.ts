import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { IUser } from '../users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import mongoose from 'mongoose';
import aqp from 'api-query-params';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  async create(createJobDto: CreateJobDto, user: IUser) {
    const newJob = await this.jobModel.create({
      ...createJobDto,
      createdBy: { _id: user._id, email: user.email },
    });

    return {
      _id: newJob._id,
      createdAt: newJob.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, rq: string) {
    const { filter, projection, population } = aqp(rq);
    delete filter.current;
    delete filter.pageSize;

    let { sort } = aqp(rq);
    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.jobModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems,
      },
      result,
    };
  }

  async findOne(id: string) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid objectId');
    }
    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new NotFoundException('jot not found');
    }

    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto, user: IUser) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid objectId');
    }

    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new NotFoundException('job not found');
    }

    return job.updateOne({
      ...updateJobDto,
      updatedBy: {
        _id: user._id,
        email: user.email,
      },
    });
  }

  async remove(id: string, user: IUser) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid objectId');
    }

    await this.jobModel.updateOne(
      { _id: id },
      {
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    return this.jobModel.softDelete({ _id: id });
  }
}
