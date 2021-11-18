import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MoreThan } from 'typeorm';
import { DateUtils } from 'typeorm/util/DateUtils';

import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import type { IFile } from '../../interfaces';
import { UserResponseDto } from '../../modules/user/dto/user-response-dto';
import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import type { UserDto } from '../user/dto/user-dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import type { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { LoginPayloadDto } from './dto/LoginPayloadDto';
import type { ResetPasswordDto } from './dto/ResetPasswordDto';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import type { UserLoginDto } from './dto/UserLoginDto';
import type { UserRegisterDto } from './dto/UserRegisterDto';
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

  async login(userLoginDto: UserLoginDto): Promise<LoginPayloadDto> {
    const userEntity = await this.validateUser(userLoginDto);

    const token = await this.createToken(userEntity);

    return new LoginPayloadDto(new UserResponseDto(userEntity), token);
  }

  async register(
    userRegisterDto: UserRegisterDto,
    file: IFile,
  ): Promise<UserResponseDto> {
    const createdUser = await this.userService.createUser(
      userRegisterDto,
      file,
    );
    const didSent = await this.sendVerificationLinkEmail(userRegisterDto.email);

    if (!didSent) {
      throw new InternalServerErrorException();
    }

    return createdUser.toDto({
      isActive: true,
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

  async sendVerificationLinkEmail(email: string): Promise<boolean> {
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<boolean> {
    const { email } = forgotPasswordDto;
    const user = await this.userService.findByUsernameOrEmail({ email });

    if (!user) {
      return true;
    }

    const token = UtilsProvider.generateToken();
    await this.userService.saveResetToken(user, token);
    await this.sendForgotPasswordEmail(email, token);

    return true;
  }

  sendForgotPasswordEmail(email: string, token: string): Promise<boolean> {
    return this.emailService.sendEmail({
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

    await this.userService.saveNewPassword(user, resetPasswordDto);

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

  async confirmEmail(token: string): Promise<boolean> {
    const email = await this.decodeConfirmationToken(token);

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

  async resendConfirmationLinkEmail(user: UserDto): Promise<boolean> {
    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    await this.sendVerificationLinkEmail(user.email);

    return true;
  }
}
