import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsPositive, Max } from 'class-validator';
import { CreateDetailDto } from './create-detail.dto';

export class UpdateDetailDto extends PartialType(CreateDetailDto) {
  
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    detail_id: number; 

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;
}
