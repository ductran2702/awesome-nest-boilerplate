import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../user/dto/user-response-dto';
import { TokenPayloadDto } from './TokenPayloadDto';

export class LoginPayloadDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokenPayloadDto })
  token: TokenPayloadDto;

  constructor(user: UserResponseDto, token: TokenPayloadDto) {
    this.user = user;
    this.token = token;
  }
}
