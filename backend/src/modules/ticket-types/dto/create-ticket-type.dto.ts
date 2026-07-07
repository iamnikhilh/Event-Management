import { IsString, IsNumber, MaxLength, Min, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTicketTypeDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsDecimal()
  @Transform(({ value }) => value?.toString?.())
  price!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}
