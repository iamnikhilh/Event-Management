import { IsString, IsEmail, MaxLength } from 'class-validator';

export class RegisterAttendeeDto {
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  ticketTypeId!: string;
}
