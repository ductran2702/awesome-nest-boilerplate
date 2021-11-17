import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import type { UserDto } from '../user/dto/user-dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
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

    return this.emailService.sendEmail({
      from: '"Company" <' + this.configService.emailConfig.from + '>',
      to: email, // list of receivers (separated by ,)
      subject: 'Verify Email',
      text: 'Verify Email',
      html:
        'Hi! <br><br> Thanks for your registration<br><br>' +
        '<a href=http://localhost:' +
        this.configService.appConfig.port +
        '/api/auth/confirm/?token=' +
        token +
        '>Click here to activate your account</a>', // html body
    });
  }

  async decodeConfirmationToken(token: string) {
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

  async confirmEmail(email: string) {
    const user = await this.userService.findByUsernameOrEmail({ email });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    await this.userService.markEmailAsConfirmed(email);
  }

  async resendConfirmationLink(userId: string) {
    const user = await this.userService.getUser(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    await this.sendVerificationLink(user.email);
  }
}
