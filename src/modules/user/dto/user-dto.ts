import { ApiPropertyOptional } from '@nestjs/swagger';

import type { UserEntity } from '../user.entity';
import { UserResponseDto } from './user-response-dto';

export type UserDtoOptions = Partial<{ isActive: boolean }>;

export class UserDto extends UserResponseDto {
  @ApiPropertyOptional()
  resetPasswordToken?: string;

  @ApiPropertyOptional()
  resetPasswordExpires?: Date;

  constructor(user: UserEntity, options?: UserDtoOptions) {
    super(user, options);
    this.resetPasswordToken = user.resetPasswordToken;
    this.resetPasswordExpires = user.resetPasswordExpires;
  }
}
