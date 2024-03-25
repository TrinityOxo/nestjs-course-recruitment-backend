import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth-guard';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { Request as exRequest, Response } from 'express';
import { IUser } from '../users/users.interface';
import { RolesService } from '../roles/roles.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private roleService: RolesService,
  ) {}

  @Public()
  @ResponseMessage('register a user')
  @Post('register')
  register(@Body() registerUserDTO: RegisterUserDto) {
    return this.authService.register(registerUserDTO);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Get('account')
  @ResponseMessage('get user account')
  async getAccount(@User() user: IUser) {
    const temp = (await this.roleService.findOne(user.role._id)) as any;
    user.permissions = temp.permissions;
    return user;
  }

  @Public()
  @Get('refresh')
  @ResponseMessage('get user by refresh token')
  refreshToken(
    @Req() request: exRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    return this.authService.processNewToken(refreshToken, response);
  }

  @Post('logout')
  @ResponseMessage('logout user')
  logout(@Res({ passthrough: true }) response: Response, @User() user: IUser) {
    return this.authService.logout(response, user);
  }
}
