import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto {

    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset?: number = 0;
    
    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    limit?: number = 10;
}