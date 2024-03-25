import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from './users.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('create a new user')
  async create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    const newUser = await this.usersService.create(createUserDto, user);
    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt,
    };
  }

  @Get()
  @ResponseMessage('find all users with paginate')
  findAll(
    @Query('currentPage') currentPage: string,
    @Query('limit') limit: string,
    @Query() rq: string,
  ) {
    return this.usersService.findAll(+currentPage, +limit, rq);
  }

  @Get(':id')
  @ResponseMessage('find a user')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch()
  @ResponseMessage('update a new user')
  async update(@Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
    const updatedUser = await this.usersService.update(updateUserDto, user);

    return {
      _id: updatedUser?._id,
      updatedAt: updatedUser?.updatedAt,
    };
  }

  @Delete(':id')
  @ResponseMessage('delete a user')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.remove(id, user);
  }
}
