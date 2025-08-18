import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  username!: string;

  @IsString()
  @IsIn(['user', 'admin', 'superadmin'])
  role!: string;

  @IsString()
  @IsIn(['USD', 'VND', 'IDR', 'PHP'])
  currency!: string;

  @IsString()
  @IsOptional()
  walletName?: string;
}
