import { HttpException, Injectable } from '@nestjs/common';
import type { DeepPartial, FindConditions } from 'typeorm';

import type { PageDto } from '../../common/dto/page.dto';
import { FileNotImageException } from '../../exceptions/file-not-image.exception';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import type { IFile } from '../../interfaces';
import type { ResetPasswordDto } from '../../modules/auth/dto/ResetPasswordDto';
import { UtilsProvider } from '../../providers/utils.provider';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type { Optional } from '../../types';
import type { UserRegisterDto } from '../auth/dto/UserRegisterDto';
import type { UserResponseDto } from './dto/user-response-dto';
import type { UsersPageOptionsDto } from './dto/users-page-options.dto';
import type { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    public readonly userRepository: UserRepository,
    public readonly validatorService: ValidatorService,
    public readonly awsS3Service: AwsS3Service,
  ) {}

  /**
   * Find single user
   */
  findOne(findData: FindConditions<UserEntity>): Promise<Optional<UserEntity>> {
    return this.userRepository.findOne(findData);
  }

  async findByUsernameOrEmail(
    options: Partial<{ username: string; email: string }>,
  ): Promise<Optional<UserEntity>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (options.email) {
      queryBuilder.orWhere('user.email = :email', {
        email: options.email,
      });
    }

    if (options.username) {
      queryBuilder.orWhere('user.username = :username', {
        username: options.username,
      });
    }

    return queryBuilder.getOne();
  }

  async save(userData: DeepPartial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.save(userData);
  }

  saveResetToken(
    user: UserEntity,
    token: string,
    resetPasswordExpires: Date,
  ): Promise<UserEntity> {
    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetPasswordExpires; // 1 hour

    return this.userRepository.save(user);
  }

  async saveNewPassword(
    user: UserEntity,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<UserEntity> {
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

    return this.userRepository.save(user);
  }

  async createUser(
    userRegisterDto: UserRegisterDto,
    file: IFile,
  ): Promise<UserEntity> {
    const user = this.userRepository.create(userRegisterDto);

    if (file && !this.validatorService.isImage(file.mimetype)) {
      throw new FileNotImageException();
    }

    if (file) {
      user.avatar = await this.awsS3Service.uploadImage(file);
    }

    return this.userRepository.save(user);
  }

  async getUsers(
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<UserResponseDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getUser(userId: string): Promise<UserResponseDto> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.where('user.id = :userId', { userId });

    const userEntity = await queryBuilder.getOne();

    if (!userEntity) {
      throw new UserNotFoundException();
    }

    return userEntity.toDto();
  }

  async markEmailAsConfirmed(email: string) {
    return this.userRepository.update(
      { email },
      {
        isEmailConfirmed: true,
      },
    );
  }
}
