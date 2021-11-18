import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { RoleType } from '../../common/constants/role-type';
import type { IFile } from '../../interfaces';
import type { UserDto } from '../user/dto/user-dto';
import type { UserResponseDto } from '../user/dto/user-response-dto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import type { LoginPayloadDto } from './dto/LoginPayloadDto';
import type { ResetPasswordDto } from './dto/ResetPasswordDto';
import type { UserLoginDto } from './dto/UserLoginDto';
import type { UserRegisterDto } from './dto/UserRegisterDto';

describe('AuthController', () => {
  let module: TestingModule;
  let service: AuthService;
  let controller: AuthController;
  const mockForgotPasswordDto: ForgotPasswordDto = {
    email: 'string',
  };

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
    isEmailConfirmed: true,
    avatar: 'string',
    phone: 'string',
    isActive: true,
  };
  const mockUserDto: UserDto = {
    ...mockUserResponseDto,
    resetPasswordToken: 'string',
    resetPasswordExpires: new Date(),
  };

  const mockLoginPayloadDto: LoginPayloadDto = {
    user: mockUserResponseDto,
    token: {
      expiresIn: 0,
      accessToken: 'string',
    },
  };

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

  const mockResetPasswordDto: ResetPasswordDto = {
    email: 'string',
    newPassword: 'string',
    resetPasswordToken: 'string',
  };

  const mockToken = 'token';

  beforeAll(async () => {
    const mockService = {
      login: jest.fn(),
      forgotPassword: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
      confirmEmail: jest.fn(),
      resendConfirmationLinkEmail: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
      ],
      imports: [],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('should call AuthService login with correct values', async () => {
      const createSpy = jest.spyOn(service, 'login');
      await controller.login(mockUserLoginDto);
      expect(createSpy).toHaveBeenCalledWith(mockUserLoginDto);
    });

    it('should throw if AuthService create throws', async () => {
      jest.spyOn(service, 'login').mockRejectedValueOnce(new Error('error'));
      await expect(controller.login(mockUserLoginDto)).rejects.toThrow(
        new Error('error'),
      );
    });

    it('should return a LoginPayloadDto when success', async () => {
      jest.spyOn(service, 'login').mockResolvedValueOnce(mockLoginPayloadDto);
      const response = await controller.login(mockUserLoginDto);
      expect(response).toEqual(mockLoginPayloadDto);
      expect(response.user).not.toHaveProperty('resetPasswordToken');
      expect(response.user).not.toHaveProperty('resetPasswordExpires');
    });
  });

  describe('forgotPassword()', () => {
    it('should call AuthService forgotPassword with correct values', async () => {
      const createSpy = jest.spyOn(service, 'forgotPassword');
      await controller.forgotPassword(mockForgotPasswordDto);
      expect(createSpy).toHaveBeenCalledWith(mockForgotPasswordDto);
    });

    it('should throw if AuthService create throws', async () => {
      jest
        .spyOn(service, 'forgotPassword')
        .mockRejectedValueOnce(new Error('error'));
      await expect(
        controller.forgotPassword(mockForgotPasswordDto),
      ).rejects.toThrow(new Error('error'));
    });

    it('should return true when success', async () => {
      jest.spyOn(service, 'forgotPassword').mockResolvedValueOnce(true);
      const isSuccess = await controller.forgotPassword(mockForgotPasswordDto);
      expect(isSuccess).toEqual(true);
    });
  });

  describe('register()', () => {
    it('should call AuthService register with correct values', async () => {
      const createSpy = jest.spyOn(service, 'register');
      await controller.register(mockUserRegisterDto, mockFile);
      expect(createSpy).toHaveBeenCalledWith(mockUserRegisterDto, mockFile);
    });

    it('should throw if AuthService create throws', async () => {
      jest.spyOn(service, 'register').mockRejectedValueOnce(new Error('error'));
      await expect(
        controller.register(mockUserRegisterDto, mockFile),
      ).rejects.toThrow(new Error('error'));
    });

    it('should return true when success', async () => {
      jest
        .spyOn(service, 'register')
        .mockResolvedValueOnce(mockUserResponseDto);
      const response = await controller.register(mockUserRegisterDto, mockFile);
      expect(response).toEqual(mockUserResponseDto);
    });
  });

  describe('resetPassword()', () => {
    it('should call AuthService resetPassword with correct values', async () => {
      const createSpy = jest.spyOn(service, 'resetPassword');
      await controller.resetPassword(mockResetPasswordDto);
      expect(createSpy).toHaveBeenCalledWith(mockResetPasswordDto);
    });

    it('should throw if AuthService create throws', async () => {
      jest
        .spyOn(service, 'resetPassword')
        .mockRejectedValueOnce(new Error('error'));
      await expect(
        controller.resetPassword(mockResetPasswordDto),
      ).rejects.toThrow(new Error('error'));
    });

    it('should return true when success', async () => {
      jest.spyOn(service, 'resetPassword').mockResolvedValueOnce(true);
      const isSuccess = await controller.resetPassword(mockResetPasswordDto);
      expect(isSuccess).toEqual(true);
    });
  });

  describe('confirmEmail()', () => {
    it('should call AuthService confirmEmail with correct values', async () => {
      const createSpy = jest.spyOn(service, 'confirmEmail');
      await controller.confirmEmail(mockToken);
      expect(createSpy).toHaveBeenCalledWith(mockToken);
    });

    it('should throw if AuthService create throws', async () => {
      jest
        .spyOn(service, 'confirmEmail')
        .mockRejectedValueOnce(new Error('error'));
      await expect(controller.confirmEmail(mockToken)).rejects.toThrow(
        new Error('error'),
      );
    });

    it('should return true when success', async () => {
      jest.spyOn(service, 'confirmEmail').mockResolvedValueOnce(true);
      const isSuccess = await controller.confirmEmail(mockToken);
      expect(isSuccess).toEqual(true);
    });
  });

  describe('resendConfirmationLinkEmail()', () => {
    it('should call AuthService resendConfirmationLinkEmail with correct values', async () => {
      const createSpy = jest.spyOn(service, 'resendConfirmationLinkEmail');
      await controller.resendConfirmationLinkEmail(mockUserDto);
      expect(createSpy).toHaveBeenCalledWith(mockUserDto);
    });

    it('should throw if AuthService create throws', async () => {
      jest
        .spyOn(service, 'resendConfirmationLinkEmail')
        .mockRejectedValueOnce(new Error('error'));
      await expect(
        controller.resendConfirmationLinkEmail(mockUserDto),
      ).rejects.toThrow(new Error('error'));
    });

    it('should return true when success', async () => {
      jest
        .spyOn(service, 'resendConfirmationLinkEmail')
        .mockResolvedValueOnce(true);
      const isSuccess = await controller.resendConfirmationLinkEmail(
        mockUserDto,
      );
      expect(isSuccess).toEqual(true);
    });
  });

  describe('getCurrentUser()', () => {
    it('should return true when success', () => {
      const response = controller.getCurrentUser(mockUserDto);
      expect(response).toEqual(mockUserDto);
    });
  });
});
