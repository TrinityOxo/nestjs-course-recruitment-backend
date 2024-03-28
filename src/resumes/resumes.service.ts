import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateResumeDto, CreateUserCvDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from '../users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>,
  ) {}

  async create(createUserCvDto: CreateUserCvDto, user: IUser) {
    const newResume = await this.resumeModel.create({
      ...createUserCvDto,
      email: user.email,
      userId: user._id,
      history: [
        {
          status: 'PENDING',
          updatedAt: new Date(),
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      ],
    });

    return {
      _id: newResume._id,
      createdAt: newResume.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, rq: string) {
    const { filter, projection, population } = aqp(rq);
    delete filter.current;
    delete filter.pageSize;

    let { sort } = aqp(rq);
    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.resumeModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.resumeModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .select(projection as any)
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

    const resume = await this.resumeModel.findById(id);
    if (!resume) {
      throw new NotFoundException('company not found');
    }

    return resume;
  }

  async update(id: string, updateResumeDto: UpdateResumeDto, user) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid objectId');
    }

    const resume = await this.resumeModel.findById(id);
    if (!resume) {
      throw new NotFoundException('company not found');
    }

    return resume.updateOne({
      status: updateResumeDto.status,
      updatedBy: {
        _id: user._id,
        email: user.email,
      },
      $push: {
        history: {
          status: updateResumeDto.status,
          updatedAt: new Date(),
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      },
    });
  }

  async remove(id: string, user: IUser) {
    await this.resumeModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.resumeModel.softDelete({ _id: id });
  }

  getCvByUser = (user: IUser) => {
    return this.resumeModel
      .findOne({ userId: user._id })
      .sort('-createdAt')
      .populate([
        {
          path: 'companyId',
          select: { name: 1 },
        },
        {
          path: 'jobId',
          select: { name: 1 },
        },
      ]);
  };
}
