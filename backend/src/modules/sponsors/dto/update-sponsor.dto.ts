import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class UpdateSponsorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsEnum(['platinum', 'gold', 'silver', 'bronze'])
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze';
}
