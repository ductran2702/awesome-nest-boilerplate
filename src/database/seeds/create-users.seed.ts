import { getConnection } from 'typeorm';
/* eslint-disable import/no-default-export */
import type { Factory, Seeder } from 'typeorm-seeding';

import { RoleType } from '../../common/constants/role-type';
import { UserEntity } from '../../modules/user/user.entity';

export default class CreateUsers implements Seeder {
  public async run(factory: Factory): Promise<void> {
    const userRepo = getConnection().getRepository<UserEntity>(UserEntity);

    // Add user with role ADMIN
    const admin = new UserEntity();
    admin.firstName = 'Admin';
    admin.lastName = 'Admin';
    admin.email = 'admin-go@yopmail.com';
    admin.password = '111111';
    admin.phone = '+79107373125';
    admin.role = RoleType.ADMIN;

    try {
      await userRepo.save(admin);
    } catch {
      console.info(' ==> Admin account already exists!');
    }

    // Add user with role USER
    const user = new UserEntity();
    user.firstName = 'User';
    user.lastName = 'User';
    user.email = 'user-go@yopmail.com';
    user.password = '111111';
    user.phone = '+79107373125';
    user.role = RoleType.USER;

    try {
      await userRepo.save(user);
    } catch {
      console.info(' ==> UserEntity account already exists!');
    }

    // Add many users with role USER
    await factory(UserEntity)({ role: [RoleType.USER] }).createMany(1);
  }
}
