import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

import { AppConfigService } from '../app-config/app-config.service';

@Injectable()
export class MailerService extends Resend {
  constructor(private readonly appConfigService: AppConfigService) {
    const { success, data, error } = appConfigService.RESEND_API_KEY;
    if (!success) {
      throw new Error(error);
    }
    super(data);
  }
}
