import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenType } from '../../common/constants/token-type';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import type { UserDto } from '../user/dto/user-dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import type { UserLoginDto } from './dto/UserLoginDto';
import { EmailVerificationRepository } from './repositories/email-verification.repository';

@Injectable()
export class AuthService {
  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ApiConfigService,
    public readonly userService: UserService,
    public readonly emailService: EmailService,
    public readonly emailVerificationRepository: EmailVerificationRepository,
  ) {}

  async createToken(user: UserEntity | UserDto): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({
        userId: user.id,
        type: TokenType.ACCESS_TOKEN,
        role: user.role,
      }),
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

  async validateEmail(email: string): Promise<UserEntity> {
    const user = await this.userService.findOne({
      email,
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async createEmailToken(email: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationRepository.findOne({
      email,
    });

    if (
      emailVerification &&
      (Date.now() - emailVerification.timestamp.getTime()) / 60_000 < 15
    ) {
      throw new HttpException(
        'LOGIN.EMAIL_SENDED_RECENTLY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      await this.emailVerificationRepository.save({
        id: emailVerification?.id,
        email,
        token: (Math.floor(Math.random() * 9_000_000) + 1_000_000).toString(), //Generate 7 digits number
        timestamp: new Date(),
      });

      return true;
    }
  }

  async sendEmailVerification(email: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationRepository.findOne({
      email,
    });

    if (emailVerification && emailVerification.token) {
      return this.emailService.sendEmail(email, emailVerification.token);
    }

    throw new HttpException(
      'REGISTER.USER_NOT_REGISTERED',
      HttpStatus.FORBIDDEN,
    );
  }
}
