import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { RoleType } from '../../../common/constants/role-type';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { UserEntity } from '../user.entity';

export type UserDtoOptions = Partial<{ isActive: boolean }>;

export class UserDto extends AbstractDto {
  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ enum: RoleType })
  role: RoleType;

  @ApiPropertyOptional()
  email: string;

  @ApiProperty()
  isEmailConfirmed: boolean;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  resetPasswordToken?: string;

  @ApiPropertyOptional()
  resetPasswordExpires?: Date;

  @ApiPropertyOptional()
  isActive?: boolean;

  constructor(user: UserEntity, options?: UserDtoOptions) {
    super(user);
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.role = user.role;
    this.email = user.email;
    this.isEmailConfirmed = user.isEmailConfirmed;
    this.avatar = user.avatar;
    this.phone = user.phone;
    this.resetPasswordToken = user.resetPasswordToken;
    this.resetPasswordExpires = user.resetPasswordExpires;
    this.isActive = options?.isActive;
  }
}
