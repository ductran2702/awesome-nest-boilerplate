import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { ResetPasswordDto } from '../dto/ResetPasswordDto';

@Entity({ name: 'reset_password' })
@UseDto(ResetPasswordDto)
export class ResetPasswordEntity extends AbstractEntity<ResetPasswordDto> {
  @Column()
  email: string;

  @Column()
  token: string;

  @Column()
  timestamp: Date;
}
