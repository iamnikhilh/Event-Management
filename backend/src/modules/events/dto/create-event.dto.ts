import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  Length,
  Min,
  Matches,
} from 'class-validator';

import { EventStatus, EventStatusValues } from '../../../database/schema';

export class CreateEventDto {
  @IsString()
  @Length(3, 255)
  title!: string;

  @IsString()
  @Length(10, 5000)
  description!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens only',
  })
  slug!: string;

  @IsUUID()
  categoryId!: string;

  @IsString()
  @Length(3, 255)
  venue!: string;

  @IsDateString()
  eventDate!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsIn([
    EventStatusValues.DRAFT,
    EventStatusValues.UPCOMING,
    EventStatusValues.ACTIVE,
    EventStatusValues.COMPLETED,
    EventStatusValues.CANCELLED,
  ])
  status?: EventStatus;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
