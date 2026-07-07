import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAttendeesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  declare search?: string;

  @IsOptional()
  @IsEnum(['registered', 'waitlisted', 'cancelled'])
  status?: 'registered' | 'waitlisted' | 'cancelled';
}
