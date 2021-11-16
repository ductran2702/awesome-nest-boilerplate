import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { EmailVerificationDto } from '../dto/EmailVerificationDto';

@Entity({ name: 'email_verification' })
@UseDto(EmailVerificationDto)
export class EmailVerificationEntity extends AbstractEntity<EmailVerificationDto> {
  @Column()
  email: string;

  @Column()
  token: string;

  @Column()
  timestamp: Date;
}
