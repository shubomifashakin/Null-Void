import { type Response } from 'express';
import { Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async authorize(@Res() res: Response) {
    const url = await this.authService.authorize();

    res.redirect(url);
  }

  @Get('callback')
  @HttpCode(200)
  callback(@Query('state') state: string, @Query('code') code: string) {
    return this.authService.callback(state, code);
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    return this.authService.logout();
  }
}
