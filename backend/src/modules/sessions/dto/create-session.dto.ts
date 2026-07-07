import {
  IsString,
  IsArray,
  IsOptional,
  IsISO8601,
  MaxLength,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  track?: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  speakerIds?: string[];
}
