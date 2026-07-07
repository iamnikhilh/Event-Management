import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPublicEventsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  declare search?: string;
}
