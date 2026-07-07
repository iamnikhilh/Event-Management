import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EventStatus, EventStatusValues } from '../../../database/schema';

export class ListEventsDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['eventDate', 'title', 'createdAt', 'capacity'])
  declare sortBy: 'eventDate' | 'title' | 'createdAt' | 'capacity';

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
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
