import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { EmailVerificationEntity } from '../entities/email-verification.entity';

@EntityRepository(EmailVerificationEntity)
export class EmailVerificationRepository extends Repository<EmailVerificationEntity> {}
