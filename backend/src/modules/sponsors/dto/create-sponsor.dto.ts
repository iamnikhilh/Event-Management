import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateSponsorDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsEnum(['platinum', 'gold', 'silver', 'bronze'])
  tier!: 'platinum' | 'gold' | 'silver' | 'bronze';
}
