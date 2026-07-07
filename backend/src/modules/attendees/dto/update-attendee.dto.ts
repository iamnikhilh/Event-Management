import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class UpdateAttendeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['registered', 'waitlisted', 'cancelled'])
  status?: 'registered' | 'waitlisted' | 'cancelled';
}
