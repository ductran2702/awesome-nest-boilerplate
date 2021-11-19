import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { Order } from '../../common/constants/order';
import { RoleType } from '../../common/constants/role-type';
import type { PageDto } from '../../common/dto/page.dto';
import type { PageMetaDto } from '../../common/dto/page-meta.dto';
import type { PageOptionsDto } from '../../common/dto/page-options.dto';
import type { UserDto } from '../user/dto/user-dto';
import type { UserResponseDto } from '../user/dto/user-response-dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let module: TestingModule;
  let service: UserService;
  let controller: UserController;

  const mockPageOptionsDto: PageOptionsDto = {
    order: Order.ASC,
    page: 1,
    take: 10,
    skip: 0,
  };

  const mockUserResponseDto: UserResponseDto = {
    id: 'uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: 'string',
    lastName: 'string',
    username: 'string',
    role: RoleType.USER,
    email: 'string',
    isEmailConfirmed: true,
    avatar: 'string',
    phone: 'string',
    isActive: true,
  };
  const mockPageMetaDto: PageMetaDto = {
    page: 1,
    take: 10,
    itemCount: 2,
    pageCount: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
  const mockUserDto: UserDto = {
    ...mockUserResponseDto,
    resetPasswordToken: 'string',
    resetPasswordExpires: new Date(),
  };
  const mockPageDto: PageDto<UserDto> = {
    data: [mockUserDto],
    meta: mockPageMetaDto,
  };

  const mockUserId = 'uuid';

  beforeAll(async () => {
    const mockService = {
      getUsers: jest.fn(),
      getUser: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockService,
        },
      ],
      imports: [],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('getUsers()', () => {
    it('should call UserService getUsers with correct values', async () => {
      const createSpy = jest.spyOn(service, 'getUsers');
      await controller.getUsers(mockPageOptionsDto);
      expect(createSpy).toHaveBeenCalledWith(mockPageOptionsDto);
    });

    it('should throw if UserService getUsers throws', async () => {
      jest.spyOn(service, 'getUsers').mockRejectedValueOnce(new Error('error'));
      await expect(controller.getUsers(mockPageOptionsDto)).rejects.toThrow(
        new Error('error'),
      );
    });

    it('should return a PageDto when success', async () => {
      jest.spyOn(service, 'getUsers').mockResolvedValueOnce(mockPageDto);
      const response = await controller.getUsers(mockPageOptionsDto);
      expect(response).toEqual(mockPageDto);
    });
  });

  describe('getUser()', () => {
    it('should call UserService getUser with correct values', async () => {
      const createSpy = jest.spyOn(service, 'getUser');
      await controller.getUser(mockUserId);
      expect(createSpy).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw if UserService getUser throws', async () => {
      jest.spyOn(service, 'getUser').mockRejectedValueOnce(new Error('error'));
      await expect(controller.getUser(mockUserId)).rejects.toThrow(
        new Error('error'),
      );
    });

    it('should return a UserDto when success', async () => {
      jest.spyOn(service, 'getUser').mockResolvedValueOnce(mockUserDto);
      const response = await controller.getUser(mockUserId);
      expect(response).toEqual(mockUserDto);
    });
  });
});
