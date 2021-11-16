import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { ResetPasswordEntity } from '../entities/reset-password.entity';

export class ResetPasswordDto extends AbstractDto {
  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  token: string;

  @ApiProperty()
  timestamp: Date;

  constructor(resetPassword: ResetPasswordEntity) {
    super(resetPassword);
    this.email = resetPassword.email;
    this.token = resetPassword.token;
    this.timestamp = resetPassword.timestamp;
  }
}
