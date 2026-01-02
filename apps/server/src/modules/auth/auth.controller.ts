import { type Request, type Response } from 'express';
import {
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { MESSAGES, TOKEN } from '../../common/constants';
import { AppConfigService } from '../../core/app-config/app-config.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: AppConfigService,
  ) {}

  @Get()
  async authorize(@Res() res: Response) {
    const url = await this.authService.authorize();

    res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Res() res: Response,
    @Query('state') state: string,
    @Query('code') code: string,
  ) {
    const userInfo = await this.authService.callback(state, code);

    if (
      !this.configService.FRONTEND_URL.success ||
      !this.configService.DOMAIN.success
    ) {
      const message =
        this.configService.FRONTEND_URL.error ||
        this.configService.DOMAIN.error;

      const title = this.configService.FRONTEND_URL.error
        ? 'Frontend URL Error'
        : 'Domain Error';

      console.error(title, message);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    res.cookie(TOKEN.ACCESS.TYPE, userInfo.accessToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: TOKEN.ACCESS.EXPIRATION_MS,
      domain: this.configService.DOMAIN.data,
    });

    res.cookie(TOKEN.REFRESH.TYPE, userInfo.refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: TOKEN.REFRESH.EXPIRATION_MS,
      domain: this.configService.DOMAIN.data,
    });

    res.redirect(302, this.configService.FRONTEND_URL.data);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies[TOKEN.ACCESS.TYPE] as string;
    const refreshToken = req.cookies[TOKEN.REFRESH.TYPE] as string;
    const message = await this.authService.logout(accessToken, refreshToken);

    if (!this.configService.DOMAIN.success) {
      const message = this.configService.DOMAIN.error;

      const title = 'Domain Error';

      console.error(title, message);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    res.clearCookie(TOKEN.ACCESS.TYPE, {
      domain: this.configService.DOMAIN.data,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie(TOKEN.REFRESH.TYPE, {
      domain: this.configService.DOMAIN.data,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return { message };
  }

  @Get('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[TOKEN.REFRESH.TYPE] as string;
    const tokens = await this.authService.refresh(refreshToken);

    if (!this.configService.DOMAIN.success) {
      const message = this.configService.DOMAIN.error;

      const title = 'Domain Error';

      console.error(title, message);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    res.cookie(TOKEN.ACCESS.TYPE, tokens.accessToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: TOKEN.ACCESS.EXPIRATION_MS,
      domain: this.configService.DOMAIN.data,
    });

    res.cookie(TOKEN.REFRESH.TYPE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: TOKEN.REFRESH.EXPIRATION_MS,
      domain: this.configService.DOMAIN.data,
    });

    return { message: 'success' };
  }
}
