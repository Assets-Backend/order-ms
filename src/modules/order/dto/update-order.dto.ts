import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsInt, IsPositive, Max } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    order_id: number; 

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;
}
