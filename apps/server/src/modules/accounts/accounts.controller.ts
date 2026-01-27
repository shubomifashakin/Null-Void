import { type Response, type Request } from 'express';

import { Throttle } from '@nestjs/throttler';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dtos/update-account.dto';

import { TOKEN } from '../../common/constants';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AppConfigService } from '../../core/app-config/app-config.service';

import { UpdateInviteDto } from './dtos/update-invite.dto';

@UseGuards(AuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly configService: AppConfigService,
  ) {}

  @Get('me')
  getAccount(@Req() req: Request) {
    return this.accountsService.getAccount(req.user.id);
  }

  @Patch('me')
  updateAccount(@Req() req: Request, @Body() body: UpdateAccountDto) {
    return this.accountsService.updateAccount(req.user.id, body);
  }

  @Delete('me')
  @Throttle({ default: { limit: 3, ttl: 2.5 } })
  async deleteAccount(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.accountsService.deleteAccount(req.user.id);

    res.clearCookie(TOKEN.ACCESS.TYPE, {
      domain: this.configService.DOMAIN.data!,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie(TOKEN.REFRESH.TYPE, {
      domain: this.configService.DOMAIN.data!,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return { message: 'success' };
  }

  @Get('invites')
  getInvites(@Req() req: Request, @Query('cursor') cursor?: string) {
    return this.accountsService.getInvites(req.user.id, cursor);
  }

  @Patch('invites/:inviteId')
  updateInvite(
    @Req() req: Request,
    @Body() body: UpdateInviteDto,
    @Param(
      'inviteId',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => {
          throw new BadRequestException('Invalid inviteId');
        },
      }),
    )
    inviteId: string,
  ) {
    return this.accountsService.updateInvite(inviteId, body.status);
  }
}
