import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator';
import { ApiFile } from '../../decorators/swagger.schema';
import { AuthGuard } from '../../guards/auth.guard';
import { AuthUserInterceptor } from '../../interceptors/auth-user-interceptor.service';
import { IFile } from '../../interfaces';
import { UserDto } from '../user/dto/user-dto';
import { UserResponseDto } from '../user/dto/user-response-dto';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { LoginPayloadDto } from './dto/LoginPayloadDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { UserLoginDto } from './dto/UserLoginDto';
import { UserRegisterDto } from './dto/UserRegisterDto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(public readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async login(@Body() userLoginDto: UserLoginDto): Promise<LoginPayloadDto> {
    return this.authService.login(userLoginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Boolean,
    description: 'Send email with forgot password link',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<boolean> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Successfully Registered',
  })
  @ApiFile({ name: 'avatar' })
  async register(
    @Body() userRegisterDto: UserRegisterDto,
    @UploadedFile() file: IFile,
  ): Promise<UserResponseDto> {
    return this.authService.register(userRegisterDto, file);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<boolean> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Query('token') token): Promise<boolean> {
    return this.authService.confirmEmail(token);
  }

  @Post('resend-confirmation-link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  async resendConfirmationLinkEmail(
    @AuthUser() user: UserDto,
  ): Promise<boolean> {
    return this.authService.resendConfirmationLinkEmail(user);
  }

  @Version('1')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserDto): UserResponseDto {
    return user;
  }
}
