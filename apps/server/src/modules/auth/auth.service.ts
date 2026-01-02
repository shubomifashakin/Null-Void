import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  authorize() {
    // TODO: Implement authorization logic
  }

  callback() {
    // TODO: Handle OAuth callback
  }

  token() {
    // TODO: Handle token exchange
  }

  logout() {
    // TODO: Handle logout
  }
}
