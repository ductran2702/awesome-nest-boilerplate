import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { ApiConfigService } from './api-config.service';

@Injectable()
export class EmailService {
  constructor(public readonly configService: ApiConfigService) {}

  public async sendEmail(email: string, emailToken: string): Promise<boolean> {
    const transporter = nodemailer.createTransport({
      host: this.configService.emailConfig.host,
      port: this.configService.emailConfig.port,
      secure: this.configService.emailConfig.secure, // true for 465, false for other ports
      auth: {
        user: this.configService.emailConfig.user,
        pass: this.configService.emailConfig.pass,
      },
    });

    const mailOptions = {
      from: '"Company" <' + this.configService.emailConfig.from + '>',
      to: email, // list of receivers (separated by ,)
      subject: 'Verify Email',
      text: 'Verify Email',
      html:
        'Hi! <br><br> Thanks for your registration<br><br>' +
        '<a href=http://localhost:' +
        this.configService.appConfig.port +
        '/auth/email/verify/' +
        emailToken +
        '>Click here to activate your account</a>', // html body
    };

    const info = await transporter.sendMail(mailOptions);
    console.info('Message sent: %s', info.messageId);

    return info;
  }
}
