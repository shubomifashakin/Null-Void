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
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dtos/update-account.dto';

import { TOKEN } from '../../common/constants';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AppConfigService } from '../../core/app-config/app-config.service';

import { UpdateInviteDto } from './dtos/update-invite.dto';

import {
  GetAccountResponseDto,
  GetInvitesResponseDto,
} from './dtos/account-response.dto';

@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly configService: AppConfigService,
  ) {}

  @ApiOperation({ summary: 'To get the logged in user account' })
  @ApiResponse({
    status: 200,
    type: GetAccountResponseDto,
    description: 'Account retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Get('me')
  getAccount(@Req() req: Request): Promise<GetAccountResponseDto> {
    return this.accountsService.getAccount(req.user.id);
  }

  @ApiOperation({ summary: 'To update the logged in user account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBody({ type: UpdateAccountDto })
  @Patch('me')
  updateAccount(@Req() req: Request, @Body() body: UpdateAccountDto) {
    return this.accountsService.updateAccount(req.user.id, body);
  }

  @ApiOperation({ summary: 'To delete the logged in user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
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
  @ApiOperation({ summary: 'To get user invites' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({
    status: 200,
    type: GetInvitesResponseDto,
    description: 'Invites retrieved successfully',
  })
  getInvites(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ): Promise<GetInvitesResponseDto> {
    return this.accountsService.getInvites(req.user.id, cursor);
  }

  @ApiOperation({ summary: 'To update an invite' })
  @ApiResponse({ status: 200, description: 'Invite updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiParam({ name: 'inviteId', description: 'Invite ID' })
  @ApiBody({ type: UpdateInviteDto })
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
    return this.accountsService.updateInvite(
      inviteId,
      body.status,
      req.user.id,
    );
  }
}
