import { type Request } from 'express';

import { Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('me')
  getAccount(@Req() req: Request) {
    return this.accountsService.getAccount(req.user.id);
  }

  @Patch('me')
  updateAccount(@Req() req: Request) {
    return this.accountsService.updateAccount(req.user.id);
  }

  @Delete('me')
  deleteAccount(@Req() req: Request) {
    return this.accountsService.deleteAccount(req.user.id);
  }
}
