import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListCategoriesDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  declare sortBy: 'name' | 'createdAt' | 'updatedAt';
}
