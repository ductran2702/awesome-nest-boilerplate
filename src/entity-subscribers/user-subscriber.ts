import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';

import { UserEntity } from '../modules/user/user.entity';
import { UtilsProvider } from '../providers/utils.provider';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
  listenTo(): typeof UserEntity {
    return UserEntity;
  }

  beforeInsert(event: InsertEvent<UserEntity>): void {
    if (event.entity.password) {
      event.entity.password = UtilsProvider.generateHash(event.entity.password);
    }

    if (event.entity.resetPasswordToken) {
      event.entity.resetPasswordToken = UtilsProvider.generateHash(
        event.entity.resetPasswordToken,
      );
    }
  }

  beforeUpdate(event: UpdateEvent<UserEntity>): void {
    if (event.entity!.password !== event.databaseEntity.password) {
      event.entity!.password = UtilsProvider.generateHash(
        event.entity!.password,
      );
    }

    if (
      event.entity!.resetPasswordToken !==
      event.databaseEntity.resetPasswordToken
    ) {
      event.entity!.resetPasswordToken = event.entity!.resetPasswordToken
        ? UtilsProvider.generateHash(event.entity!.resetPasswordToken)
        : undefined;
    }
  }
}
