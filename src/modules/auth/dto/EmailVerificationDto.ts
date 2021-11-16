import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { EmailVerificationEntity } from '../entities/email-verification.entity';

export class EmailVerificationDto extends AbstractDto {
  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  token: string;

  @ApiProperty({
    type: 'timestamp',
  })
  timestamp: Date;

  constructor(emailVerification: EmailVerificationEntity) {
    super(emailVerification);
    this.email = emailVerification.email;
    this.token = emailVerification.token;
    this.timestamp = emailVerification.timestamp;
  }
}
