import { Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, Max, Min, ValidateNested } from "class-validator";
import { CreateOrderDetailDto } from "./create-order-detail.dto";

export class CreateOrderDto {

    client_fk: number;

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;
    
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    company_fk: number;

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    patient_fk: number;
    
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    treatment_fk: number;
    
    @IsInt()
    @Min(1)
    @Max(7)
    frequency: number;

    @IsOptional()
    @IsString()
    diagnosis?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateOrderDetailDto)
    order_detail?: CreateOrderDetailDto
}
