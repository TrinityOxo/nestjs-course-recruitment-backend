import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../users/users.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';
import { ADMIN_ROLE } from '../databases/sample';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const isExist = await this.roleModel.findOne({ name: createRoleDto.name });
    if (!isExist) {
      throw new ConflictException('role already exist');
    }

    const newRole = await this.roleModel.create({
      ...createRoleDto,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });

    return {
      _id: newRole._id,
      createdAt: newRole.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, rq: string) {
    const { filter, projection, population } = aqp(rq);
    delete filter.current;
    delete filter.pageSize;

    let { sort } = aqp(rq);
    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.roleModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.roleModel
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

    const role = await this.roleModel.findById(id).populate({
      path: 'permissions',
      select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 },
    });
    if (!role) {
      throw new NotFoundException('role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid objectId');
    }

    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('role not found');
    }

    // const roleWithNewName = await this.roleModel.findOne({
    //   name: updateRoleDto.name,
    // });

    // if (roleWithNewName && roleWithNewName._id !== role._id) {
    //   throw new ConflictException('role already exist');
    // }

    return role.updateOne({
      ...updateRoleDto,
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

    const roleToDelete = await this.roleModel.findById(id);
    if (roleToDelete.name === ADMIN_ROLE) {
      throw new BadRequestException("can't delete role admin");
    }

    await this.roleModel.updateOne(
      {
        _id: id,
      },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.roleModel.softDelete({ _id: id });
  }
}
