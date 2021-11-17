import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsEmail()
  @ApiProperty()
  email: string;

  @ApiProperty()
  @IsString()
  newPassword: string;

  @IsString()
  @ApiProperty()
  resetPasswordToken: string;

  constructor(email: string, newPassword: string, resetPasswordToken: string) {
    this.email = email;
    this.newPassword = newPassword;
    this.resetPasswordToken = resetPasswordToken;
  }
}
