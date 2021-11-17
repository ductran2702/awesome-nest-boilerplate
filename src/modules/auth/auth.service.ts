import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { MoreThan } from 'typeorm';
import { DateUtils } from 'typeorm/util/DateUtils';

import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import type { UserDto } from '../user/dto/user-dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import type { ResetPasswordDto } from './dto/ResetPasswordDto';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import type { UserLoginDto } from './dto/UserLoginDto';
import type { ITokenPayload } from './interfaces/ITokenPayload.interface';
import type { IVerificationTokenPayload } from './interfaces/IVerificationTokenPayload.interface';

@Injectable()
export class AuthService {
  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ApiConfigService,
    public readonly userService: UserService,
    public readonly emailService: EmailService,
  ) {}

  async createToken(user: UserEntity | UserDto): Promise<TokenPayloadDto> {
    const payload: ITokenPayload = { userId: user.id, role: user.role };

    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync(payload),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findOne({
      email: userLoginDto.email,
    });
    const isPasswordValid = await UtilsProvider.validateHash(
      userLoginDto.password,
      user?.password,
    );

    if (!user || !isPasswordValid) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async sendVerificationLink(email: string): Promise<boolean> {
    const payload: IVerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload);

    const hasInfo = await this.emailService.sendEmail({
      from: '"Company" <' + this.configService.emailConfig.from + '>',
      to: email, // list of receivers (separated by ,)
      subject: 'Verify Email',
      text: 'Verify Email',
      html:
        'Hi! <br><br> Thanks for your registration<br><br>' +
        '<a href=http://localhost:' +
        this.configService.appConfig.port +
        '/api/auth/confirm-email/?token=' +
        token +
        '>Click here to activate your account</a>', // html body
    });

    if (!hasInfo) {
      throw new InternalServerErrorException();
    }

    return true;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new UserNotFoundException();
    }

    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3_600_000); // 1 hour
    await this.userService.save(user);

    await this.emailService.sendEmail({
      from: '"Company" <' + this.configService.emailConfig.from + '>',
      to: email, // list of receivers (separated by ,)
      subject: 'Forgot Password Email',
      text: 'Forgot Password Email',
      html:
        'Hi! <br><br> Thanks you, you want to reset password <br><br>' +
        '<a href=http://localhost:' +
        this.configService.appConfig.port +
        '/api/auth/reset-password/?token=' +
        token +
        '>Click here to reset password</a>', // html body
    });

    return true;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    const user = await this.userService.findOne({
      email: resetPasswordDto.email,
      resetPasswordExpires: MoreThan(
        DateUtils.mixedDateToUtcDatetimeString(new Date()),
      ),
    });

    if (!user) {
      throw new HttpException(
        'Password reset token is invalid or has expired',
        401,
      );
    }

    const isTokenValid = await UtilsProvider.validateHash(
      resetPasswordDto.resetPasswordToken,
      user.resetPasswordToken,
    );

    if (!isTokenValid) {
      throw new HttpException(
        'Password reset token is invalid or has expired',
        401,
      );
    }

    user.password = resetPasswordDto.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.userService.save(user);

    return true;
  }

  async decodeConfirmationToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify(token);

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }

      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }

      throw new BadRequestException('Bad confirmation token');
    }
  }

  async confirmEmail(email: string): Promise<boolean> {
    const user = await this.userService.findByUsernameOrEmail({ email });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    await this.userService.markEmailAsConfirmed(email);

    return true;
  }

  async resendConfirmationLink(userId: string): Promise<boolean> {
    const user = await this.userService.getUser(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    await this.sendVerificationLink(user.email);

    return true;
  }
}
