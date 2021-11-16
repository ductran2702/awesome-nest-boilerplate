import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { ResetPasswordEntity } from '../entities/reset-password.entity';

@EntityRepository(ResetPasswordEntity)
export class ResetPasswordRepository extends Repository<ResetPasswordEntity> {}
