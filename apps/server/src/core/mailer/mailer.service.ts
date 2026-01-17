import { Injectable } from '@nestjs/common';
import { Attachment, Resend } from 'resend';

import { AppConfigService } from '../app-config/app-config.service';

import { FnResult } from 'types/fnResult';

@Injectable()
export class MailerService extends Resend {
  constructor(private readonly appConfigService: AppConfigService) {
    const { success, data, error } = appConfigService.RESEND_API_KEY;
    if (!success) {
      throw error;
    }
    super(data);
  }

  async sendMail<T>({
    receiver,
    sender,
    attachments,
    subject,
    html,
  }: {
    receiver: string;
    sender: string;
    html: string;
    subject: string;
    attachments?: Attachment[];
  }): Promise<FnResult<T>> {
    const { error } = await this.emails.send({
      from: sender,
      to: receiver,
      attachments: attachments,
      html,
      subject,
    });

    if (error) {
      return {
        success: false,
        data: null,
        error,
      };
    }

    return {
      error: null,
      success: true,
      data: null as T,
    };
  }
}
