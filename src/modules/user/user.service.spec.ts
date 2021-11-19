import { HttpException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { DeepPartial, FindConditions } from 'typeorm';

import { RoleType } from '../../common/constants/role-type';
import { FileNotImageException } from '../../exceptions/file-not-image.exception';
import type { IFile } from '../../interfaces';
import { UtilsProvider } from '../../providers/utils.provider';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type { ResetPasswordDto } from '../auth/dto/ResetPasswordDto';
import type { UserRegisterDto } from '../auth/dto/UserRegisterDto';
import type { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let module: TestingModule;
  let service: UserService;
  let repository: UserRepository;
  let awsS3Service: AwsS3Service;
  let validatorService: ValidatorService;

  const mockFindCondition: FindConditions<UserEntity> = {
    email: 'string',
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
    password: 'string',
    resetPasswordToken: UtilsProvider.generateHash('resetPasswordToken'),
    resetPasswordExpires: new Date(Date.now() + 3_600_000),
  };

  const partailUserData: DeepPartial<UserEntity> = {
    username: 'string',
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
    resetPasswordToken: 'resetPasswordToken',
  };

  const mockToken = 'token';
  const now = new Date();

  beforeAll(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    const mockAwsS3Service = {
      uploadImage: jest.fn(),
    };
    const mockValidatorService = {
      isImage: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockRepository,
        },
        {
          provide: AwsS3Service,
          useValue: mockAwsS3Service,
        },
        {
          provide: ValidatorService,
          useValue: mockValidatorService,
        },
      ],
      imports: [],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
    awsS3Service = module.get<AwsS3Service>(AwsS3Service);
    validatorService = module.get<ValidatorService>(ValidatorService);
  });

  describe('findOne()', () => {
    it('should call UserRepository findOne with correct values', async () => {
      const spy = jest.spyOn(repository, 'findOne');
      await service.findOne(mockFindCondition);
      expect(spy).toHaveBeenCalledWith(mockFindCondition);
    });

    it('should throw if UserRepository findOne throws', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new Error('error'));
      await expect(service.findOne(mockFindCondition)).rejects.toThrow(
        new Error('error'),
      );
    });

    it('should return a UserEntity when success', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const response = await service.findOne(mockFindCondition);
      expect(response).toEqual(mockUserEntity);
    });
  });

  describe('save()', () => {
    it('should call UserRepository save with correct values', async () => {
      const spy = jest.spyOn(repository, 'save');
      await service.save(partailUserData);
      expect(spy).toHaveBeenCalledWith(partailUserData);
    });

    it('should throw if UserRepository save throws', async () => {
      jest.spyOn(service, 'save').mockRejectedValueOnce(new Error('error'));
      await expect(service.save(partailUserData)).rejects.toThrow(
        new Error('error'),
      );
    });

    it('should return a UserEntity when success', async () => {
      jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const response = await service.save(partailUserData);
      expect(response).toEqual(mockUserEntity);
    });
  });

  describe('saveResetToken()', () => {
    it('should call UserRepository save with correct values', async () => {
      const mockNewUserEntity = {
        ...mockUserEntity,
        resetPasswordToken: mockToken,
        resetPasswordExpires: now,
      } as UserEntity;
      const spy = jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(mockNewUserEntity);
      await service.saveResetToken(
        { ...mockUserEntity } as UserEntity,
        mockToken,
        now,
      );
      expect(spy).toHaveBeenCalledWith(mockNewUserEntity);
    });

    it('should return a correct value when success', async () => {
      const mockNewUserEntity = {
        ...mockUserEntity,
        resetPasswordToken: mockToken,
        resetPasswordExpires: now,
      } as UserEntity;
      jest.spyOn(repository, 'save').mockResolvedValueOnce(mockNewUserEntity);
      const response = await service.saveResetToken(
        { ...mockUserEntity } as UserEntity,
        mockToken,
        now,
      );
      expect(response).toEqual(mockNewUserEntity);
    });
  });

  describe('createUser()', () => {
    it('should call UserRepository save with correct values', async () => {
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValueOnce(mockUserEntity as UserEntity);
      const validatorSpy = jest
        .spyOn(validatorService, 'isImage')
        .mockReturnValueOnce(true);
      const awsSpy = jest
        .spyOn(awsS3Service, 'uploadImage')
        .mockResolvedValueOnce('');
      await service.createUser(mockUserRegisterDto, mockFile);
      expect(createSpy).toHaveBeenCalledWith(mockUserRegisterDto);
      expect(validatorSpy).toHaveBeenCalledWith(mockFile.mimetype);
      expect(awsSpy).toHaveBeenCalledWith(mockFile);
    });

    it('should throw if UserRepository save throws', async () => {
      jest
        .spyOn(repository, 'create')
        .mockReturnValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(validatorService, 'isImage').mockReturnValueOnce(false);
      jest.spyOn(awsS3Service, 'uploadImage').mockResolvedValueOnce('');
      await expect(
        service.createUser(mockUserRegisterDto, mockFile),
      ).rejects.toThrow(new FileNotImageException());
    });

    it('should return a correct value when success', async () => {
      jest
        .spyOn(repository, 'create')
        .mockReturnValueOnce(mockUserEntity as UserEntity);
      jest.spyOn(validatorService, 'isImage').mockReturnValueOnce(true);
      jest.spyOn(awsS3Service, 'uploadImage').mockResolvedValueOnce('');
      jest
        .spyOn(repository, 'create')
        .mockReturnValueOnce(mockUserEntity as UserEntity);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);
      const response = await service.createUser(mockUserRegisterDto, mockFile);
      expect(response).toEqual(mockUserEntity);
    });
  });

  describe('saveNewPassword()', () => {
    it('should call UserRepository save with correct values', async () => {
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(mockUserEntity as UserEntity);

      await service.saveNewPassword(
        { ...mockUserEntity } as UserEntity,
        mockResetPasswordDto,
      );

      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw if HttpException when Password reset token is invalid', async () => {
      await expect(
        service.saveNewPassword(
          { ...mockUserEntity, resetPasswordToken: 'wrong' } as UserEntity,
          mockResetPasswordDto,
        ),
      ).rejects.toThrow(
        new HttpException(
          'Password reset token is invalid or has expired',
          401,
        ),
      );
    });

    it('should return a correct value when success', async () => {
      const newMockUserEntity = {
        ...mockUserEntity,
        resetPasswordToken: '',
        resetPasswordExpires: new Date(),
      };
      jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(newMockUserEntity as UserEntity);
      const response = await service.saveNewPassword(
        mockUserEntity as UserEntity,
        mockResetPasswordDto,
      );
      expect(response).toEqual(newMockUserEntity);
    });
  });
});
