import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type * as Mail from 'nodemailer/lib/mailer';

import { ApiConfigService } from './api-config.service';

@Injectable()
export class EmailService {
  private nodemailerTransport: Mail;

  constructor(public readonly configService: ApiConfigService) {
    this.nodemailerTransport = nodemailer.createTransport({
      host: this.configService.emailConfig.host,
      port: this.configService.emailConfig.port,
      secure: this.configService.emailConfig.secure, // true for 465, false for other ports
      auth: {
        user: this.configService.emailConfig.user,
        pass: this.configService.emailConfig.pass,
      },
    });
  }

  async sendEmail(options: Mail.Options): Promise<boolean> {
    const info = await this.nodemailerTransport.sendMail(options);
    console.info('Message sent: %s', info.messageId);

    return info;
  }
}
