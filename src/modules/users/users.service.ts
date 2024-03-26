import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { USER_ROLE } from '../databases/sample';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  hashPassword = (password: string) => {
    const salt = genSaltSync(12);
    const hashedPassword = hashSync(password, salt);

    return hashedPassword;
  };

  isValidPassword = (password: string, hashedPassword: string) => {
    if (!compareSync(password, hashedPassword)) {
      return false;
    }
    return true;
  };

  updateUserRefreshToken = (refreshToken: string, _id: string) => {
    return this.userModel.updateOne({ _id }, { refreshToken });
  };

  async register(registerUserDTO: RegisterUserDto) {
    const { name, email, password, age, gender, address } = registerUserDTO;
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new ConflictException('user already exist');
    }

    const userRole = await this.roleModel.findOne({ name: USER_ROLE });

    const hashedPassword = this.hashPassword(password);

    return this.userModel.create({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      address,
      role: userRole?._id,
    });
  }

  async create(createUserDto: CreateUserDto, user: IUser) {
    const { name, email, password, age, gender, address, role, company } =
      createUserDto;

    const existedUser = await this.userModel.findOne({ email });
    if (existedUser) {
      throw new ConflictException('user already exist');
    }
    const hashedPassword = this.hashPassword(password);

    return this.userModel.create({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      address,
      role,
      company,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
  }

  async findAll(currentPage: number, limit: number, rq: string) {
    const { filter, projection, population } = aqp(rq);
    delete filter.currentPage;

    let { sort } = aqp(rq);
    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .select('-password')
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

  findOne(id: string) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid object id');
    }

    const user = this.userModel
      .findById(id)
      .select('-password')
      .populate({ path: 'role', select: { _id: 1, name: 1 } });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .populate({ path: 'role', select: { name: 1 } });

    return user;
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      updateUserDto._id,
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    if (!updatedUser) {
      throw new NotFoundException('user not found');
    }

    return updatedUser;
  }

  async remove(id: string, user: IUser) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
      throw new UnprocessableEntityException('invalid objectId');
    }

    const userToDelete = await this.userModel.findById(id);
    if (userToDelete.email === 'admin@gmail.com') {
      throw new BadRequestException("can't delete admin");
    }

    await this.userModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.userModel.softDelete({ _id: id });
  }

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel
      .findOne({ refreshToken })
      .populate({ path: 'role', select: { name: 1 } });
  };
}
