import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { IUser } from '../users/users.interface';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private roleService: RolesService,
  ) {}

  createRefreshToken = (payload: any) => {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRE'),
    });
  };

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findUserByToken(refreshToken);
      if (!user) {
        throw new NotFoundException('Invalid refresh token');
      }

      const { _id, name, email, role } = user;

      const payload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sub: 'token refresh',
        iss: 'from server',
      };

      const refresh_Token = this.createRefreshToken(payload);

      await this.usersService.updateUserRefreshToken(
        refresh_Token,
        _id.toString(),
      );

      const userRole = user.role as unknown as { _id: string; name: string };
      const temp = await this.roleService.findOne(userRole._id);

      response.clearCookie('refresh_token');

      response.cookie('refresh_token', refresh_Token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
      });

      return {
        message: 'ok',
        access_token: this.jwtService.sign(payload),
        user: {
          _id,
          name,
          email,
          role,
          Permissions: temp?.permissions ?? [],
        },
      };
    } catch (err) {
      throw new BadRequestException('Invalid refresh token');
    }
  };

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValidPassword = this.usersService.isValidPassword(
      password,
      user.password,
    );

    if (!isValidPassword) {
      return null;
    }

    const userRole = user.role as unknown as { _id: string; name: string };

    const temp = await this.roleService.findOne(userRole._id);

    const objUser = {
      ...user.toObject(),
      permissions: temp?.permissions ?? [],
    };

    return objUser;
  }

  async register(registerUserDTO: RegisterUserDto) {
    const newUser = await this.usersService.register(registerUserDTO);

    return {
      _id: newUser._id,
      createdAt: newUser.createdAt,
    };
  }

  async login(user: IUser, response: Response) {
    const { _id, name, email, role, permissions } = user;
    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      sub: 'token login',
      iss: 'from server',
    };

    const refreshToken = this.createRefreshToken(payload);

    await this.usersService.updateUserRefreshToken(refreshToken, _id);

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
        permissions,
      },
    };
  }

  logout = async (response: Response, user: IUser) => {
    await this.usersService.updateUserRefreshToken('', user._id);
    response.clearCookie('refresh_token');
    return 'oke';
  };
}
