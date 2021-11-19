import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { TokenExpiredError } from 'jsonwebtoken';

import { RoleType } from '../../common/constants/role-type';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import type { IFile } from '../../interfaces';
import { UtilsProvider } from '../../providers/utils.provider';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { EmailService } from '../../shared/services/email.service';
import type { UserDto } from '../user/dto/user-dto';
import { UserResponseDto } from '../user/dto/user-response-dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import type { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { LoginPayloadDto } from './dto/LoginPayloadDto';
import type { ResetPasswordDto } from './dto/ResetPasswordDto';
import type { UserLoginDto } from './dto/UserLoginDto';
import type { UserRegisterDto } from './dto/UserRegisterDto';
import type { ITokenPayload } from './interfaces/ITokenPayload.interface';
import type { IVerificationTokenPayload } from './interfaces/IVerificationTokenPayload.interface';

describe('UserService', () => {
  let module: TestingModule;
  let userService: UserService;
  let emailService: EmailService;
  //let apiConfigService: ApiConfigService;
  let jwtService: JwtService;
  let authService: AuthService;

  const mockUserLoginDto: UserLoginDto = {
    email: 'string',
    password: 'string',
  };
  const mockUserResponseDto: UserResponseDto = {
    id: 'string',
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: 'string',
    lastName: 'string',
    username: 'string',
    role: RoleType.USER,
    email: 'string',
    isEmailConfirmed: false,
    avatar: 'string',
    phone: 'string',
    isActive: true,
  };
  const mockUserDto: UserDto = {
    ...mockUserResponseDto,
    resetPasswordToken: 'string',
    resetPasswordExpires: new Date(),
  };
  const mockUserEntity = {
    id: 'string',
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: 'string',
    lastName: 'string',
    username: 'string',
    role: RoleType.USER,
    email: 'string',
    isEmailConfirmed: true,
    avatar: 'string',
    phone: 'string',
    password: UtilsProvider.generateHash('string'),
    toDto: () => mockUserDto,
  };
  const mockToken = 'token';
  const mockUserRegisterDto: UserRegisterDto = {
    firstName: 'string',
    lastName: 'string',
    username: 'string',
    email: 'string',
    phone: 'string',
    password: 'string',
  };
  const mockFile: IFile = {
    encoding: 'string',
    buffer: Buffer.from('foo'),
    fieldname: 'string',
    mimetype: 'string',
    originalname: 'string',
    size: 0,
  };
  const mockForgotPasswordDto: ForgotPasswordDto = {
    email: 'string',
  };

  const mockResetPasswordDto: ResetPasswordDto = {
    email: 'string',
    newPassword: 'string',
    resetPasswordToken: 'string',
  };

  const mockVerificationTokenPayload: IVerificationTokenPayload = {
    email: 'string',
  };

  beforeAll(async () => {
    const mockUserService = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createUser: jest.fn(),
      findByUsernameOrEmail: jest.fn(),
      saveResetToken: jest.fn(),
      saveNewPassword: jest.fn(),
      markEmailAsConfirmed: jest.fn(),
    };
    const mockEmailService = {
      sendEmail: jest.fn(),
    };
    const mockApiConfigService = {
      authConfig: { jwtExpirationTime: 123 },
      emailConfig: { from: 'string' },
      appConfig: { port: 0 },
    };
    const mockJwtService = {
      signAsync: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn().mockImplementation(() => {
        throw new TokenExpiredError('', new Date());
      }),
    };

    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ApiConfigService,
          useValue: mockApiConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
      imports: [],
    }).compile();

    userService = module.get<UserService>(UserService);
    emailService = module.get<EmailService>(EmailService);
    //apiConfigService = module.get<ApiConfigService>(ApiConfigService);
    jwtService = module.get<JwtService>(JwtService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser()', () => {
    it('should call UserRepository findOne with correct values', async () => {
      const spy = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      await authService.validateUser(mockUserLoginDto);
      expect(spy).toHaveBeenCalledWith({ email: mockUserLoginDto.email });
    });

    it('should throw UserNotFoundException if not found user', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);
      await expect(authService.validateUser(mockUserLoginDto)).rejects.toThrow(
        new UserNotFoundException(),
      );
    });

    it('should throw UserNotFoundException wrong password', async () => {
      const mockUserLoginDtoWithWrongPassword = {
        ...mockUserLoginDto,
        password: 'wrong',
      };
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      await expect(
        authService.validateUser(mockUserLoginDtoWithWrongPassword),
      ).rejects.toThrow(new UserNotFoundException());
    });

    it('should return a correct UserEntity when success', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const response = await authService.validateUser(mockUserLoginDto);
      expect(response).toEqual(mockUserEntity);
    });
  });

  describe('login()', () => {
    it('should call UserRepository findOne and signAsync with correct values', async () => {
      const findOneSpy = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const signAsyncSpy = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(mockToken);
      const payload: ITokenPayload = {
        userId: mockUserEntity.id,
        role: mockUserEntity.role,
      };
      await authService.login(mockUserLoginDto);
      expect(findOneSpy).toHaveBeenCalledWith({
        email: mockUserLoginDto.email,
      });
      expect(signAsyncSpy).toHaveBeenCalledWith(payload);
    });

    it('should throw UserNotFoundException if not found user', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(mockToken);
      await expect(authService.login(mockUserLoginDto)).rejects.toThrow(
        new UserNotFoundException(),
      );
    });

    it('should throw UserNotFoundException wrong password', async () => {
      const mockUserLoginDtoWithWrongPassword = {
        ...mockUserLoginDto,
        password: 'wrong',
      };
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      await expect(
        authService.login(mockUserLoginDtoWithWrongPassword),
      ).rejects.toThrow(new UserNotFoundException());
    });

    it('should return a correct LoginPayloadDto when success', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(mockToken);
      const response = await authService.login(mockUserLoginDto);
      const payload = new LoginPayloadDto(
        new UserResponseDto(mockUserEntity as UserEntity),
        await authService.createToken(mockUserEntity as UserEntity),
      );
      expect(response).toEqual(payload);
    });
  });

  describe('register()', () => {
    it('should call UserRepository createUser with correct values', async () => {
      const createUserSpy = jest
        .spyOn(userService, 'createUser')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const sendEmailSpy = jest
        .spyOn(emailService, 'sendEmail')
        .mockResolvedValueOnce(true);
      const signSpy = jest.spyOn(jwtService, 'sign');

      await authService.register(mockUserRegisterDto, mockFile);
      expect(createUserSpy).toHaveBeenCalledWith(mockUserRegisterDto, mockFile);
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if cannot send email', async () => {
      jest
        .spyOn(userService, 'createUser')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce(false);
      jest.spyOn(jwtService, 'sign');

      await expect(
        authService.register(mockUserRegisterDto, mockFile),
      ).rejects.toThrow(new InternalServerErrorException());
    });

    it('should throw error if createUser throw error', async () => {
      jest
        .spyOn(userService, 'createUser')
        .mockRejectedValueOnce(new Error('error'));
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce(true);
      jest.spyOn(jwtService, 'sign');

      await expect(
        authService.register(mockUserRegisterDto, mockFile),
      ).rejects.toThrow(new Error('error'));
    });

    it('should return a correct UserResponseDto when success', async () => {
      jest
        .spyOn(userService, 'createUser')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce(true);
      jest.spyOn(jwtService, 'sign');
      const response = await authService.register(
        mockUserRegisterDto,
        mockFile,
      );
      expect(response).toEqual(mockUserDto);
    });
  });

  describe('forgotPassword()', () => {
    it('should call UserRepository createUser with correct values', async () => {
      const findUserSpy = jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const saveResetTokenSpy = jest.spyOn(userService, 'saveResetToken');

      await authService.forgotPassword(mockForgotPasswordDto);
      expect(findUserSpy).toHaveBeenCalledWith({
        email: mockForgotPasswordDto.email,
      });
      expect(saveResetTokenSpy).toHaveBeenCalled();
    });

    it('should throw Error if saveResetToken throw', async () => {
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest
        .spyOn(userService, 'saveResetToken')
        .mockRejectedValueOnce(new Error('error'));

      await expect(
        authService.forgotPassword(mockForgotPasswordDto),
      ).rejects.toThrow(new Error('error'));
    });

    it('should return a true when success', async () => {
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest
        .spyOn(userService, 'saveResetToken')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce(true);

      const isSuccess = await authService.forgotPassword(mockForgotPasswordDto);
      expect(isSuccess).toEqual(true);
    });

    it('should return a false when sendEmail fail', async () => {
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest
        .spyOn(userService, 'saveResetToken')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce(false);

      const isSuccess = await authService.forgotPassword(mockForgotPasswordDto);
      expect(isSuccess).toEqual(false);
    });

    it('should return a true even if not found user', async () => {
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(userService, 'saveResetToken')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce(true);

      const isSuccess = await authService.forgotPassword(mockForgotPasswordDto);
      expect(isSuccess).toEqual(true);
    });
  });

  describe('resetPassword()', () => {
    it('should call UserRepository createUser with correct values', async () => {
      const findOneSpy = jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const saveNewPasswordSpy = jest.spyOn(userService, 'saveNewPassword');

      await authService.resetPassword(mockResetPasswordDto);
      expect(findOneSpy).toHaveBeenCalledWith({
        email: mockResetPasswordDto.email,
      });
      expect(saveNewPasswordSpy).toHaveBeenCalledWith(
        mockUserEntity as UserEntity,
        mockResetPasswordDto,
      );
    });

    it('should throw Error if saveNewPassword throw', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest
        .spyOn(userService, 'saveNewPassword')
        .mockRejectedValueOnce(new Error('error'));

      await expect(
        authService.resetPassword(mockResetPasswordDto),
      ).rejects.toThrow(new Error('error'));
    });

    it('should throw HttpException if not found user', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValueOnce(undefined);
      jest.spyOn(userService, 'saveNewPassword');

      await expect(
        authService.resetPassword(mockResetPasswordDto),
      ).rejects.toThrow(
        new HttpException(
          'Password reset token is invalid or has expired',
          401,
        ),
      );
    });

    it('should return a true when success', async () => {
      jest
        .spyOn(userService, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(userService, 'saveNewPassword');

      const isSuccess = await authService.resetPassword(mockResetPasswordDto);
      expect(isSuccess).toEqual(true);
    });
  });

  describe('decodeConfirmationToken()', () => {
    it('should call UserRepository createUser with correct values', async () => {
      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValueOnce(mockVerificationTokenPayload);

      await authService.decodeConfirmationToken(mockToken);
      expect(verifySpy).toHaveBeenCalledWith(mockToken);
    });

    it('should throw BadRequestException if verify throw', async () => {
      jest.spyOn(jwtService, 'verify');

      await expect(
        authService.decodeConfirmationToken(mockToken),
      ).rejects.toThrow(
        new BadRequestException('Email confirmation token expired'),
      );
    });

    it('should throw BadRequestException if payload not correct', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValueOnce({});

      await expect(
        authService.decodeConfirmationToken(mockToken),
      ).rejects.toThrow(new BadRequestException('Bad confirmation token'));
    });

    it('should return a correct value when success', async () => {
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValueOnce(mockVerificationTokenPayload);
      const response = await authService.decodeConfirmationToken(mockToken);
      expect(response).toEqual(mockVerificationTokenPayload.email);
    });
  });

  describe('confirmEmail()', () => {
    it('should call UserRepository createUser with correct values', async () => {
      mockUserEntity.isEmailConfirmed = false;
      const findSpy = jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const markSpy = jest.spyOn(userService, 'markEmailAsConfirmed');
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValueOnce(mockVerificationTokenPayload);

      await authService.confirmEmail(mockToken);
      expect(findSpy).toHaveBeenCalledWith(mockVerificationTokenPayload);
      expect(markSpy).toHaveBeenCalledWith(mockVerificationTokenPayload.email);
    });

    it('should throw UserNotFoundException if user not found', async () => {
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(undefined);
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValueOnce(mockVerificationTokenPayload);

      await expect(authService.confirmEmail(mockToken)).rejects.toThrow(
        new UserNotFoundException(),
      );
    });

    it('should throw BadRequestException if Email already confirmed', async () => {
      mockUserEntity.isEmailConfirmed = true;
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValueOnce(mockVerificationTokenPayload);

      await expect(authService.confirmEmail(mockToken)).rejects.toThrow(
        new BadRequestException('Email already confirmed'),
      );
    });

    it('should return true when success', async () => {
      mockUserEntity.isEmailConfirmed = false;
      jest
        .spyOn(userService, 'findByUsernameOrEmail')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(userService, 'markEmailAsConfirmed');
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValueOnce(mockVerificationTokenPayload);

      const isSuccess = await authService.confirmEmail(mockToken);
      expect(isSuccess).toEqual(true);
    });
  });

  describe('resendConfirmationLinkEmail()', () => {
    it('should call UserRepository createUser with correct values', async () => {
      mockUserEntity.isEmailConfirmed = false;
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');
      const verifySpy = jest.spyOn(jwtService, 'sign'); //.mockReturnValueOnce(mockVerificationTokenPayload);

      await authService.resendConfirmationLinkEmail(mockUserDto);
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(verifySpy).toHaveBeenCalledWith({ email: mockUserDto.email });
    });

    it('should throw BadRequestException if Email already confirmed', async () => {
      mockUserDto.isEmailConfirmed = true;
      jest.spyOn(emailService, 'sendEmail');
      jest.spyOn(jwtService, 'sign'); //.mockReturnValueOnce(mockVerificationTokenPayload);

      await expect(
        authService.resendConfirmationLinkEmail(mockUserDto),
      ).rejects.toThrow(new BadRequestException('Email already confirmed'));
    });

    it('should return true when success', async () => {
      mockUserDto.isEmailConfirmed = false;
      jest.spyOn(emailService, 'sendEmail');
      jest.spyOn(jwtService, 'sign'); //.mockReturnValueOnce(mockVerificationTokenPayload);

      const isSuccess = await authService.resendConfirmationLinkEmail(
        mockUserDto,
      );
      expect(isSuccess).toEqual(true);
    });
  });
});
