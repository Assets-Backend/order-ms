import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsPositive, Max } from 'class-validator';
import { CreateOrderDetailDto } from './create-order-detail.dto';

export class UpdateOrderDetailDto extends PartialType(CreateOrderDetailDto) {
  
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    detail_id: number; 

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;
}
