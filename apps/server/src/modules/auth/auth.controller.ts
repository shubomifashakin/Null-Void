import { Controller, Get, HttpCode, Post } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  authorize() {
    return this.authService.authorize();
  }

  @Post('callback')
  @HttpCode(200)
  callback() {
    return this.authService.callback();
  }

  @Post('token')
  @HttpCode(200)
  token() {
    return this.authService.token();
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    return this.authService.logout();
  }
}
