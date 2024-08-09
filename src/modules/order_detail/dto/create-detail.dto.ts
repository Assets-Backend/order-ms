import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class CreateDetailDto {

    client_fk: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    order_fk: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    professional_fk?: number;

    @IsDate()
    @Type(() => Date)
    start_date: Date;
    
    @IsDate()
    @Type(() => Date)
    finish_date: Date;
    
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(31)
    total_sessions: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    sessions: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    coinsurance: number
    
    @IsOptional()
    @IsNumber()
    @Min(0)
    value: number
    
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost: number
    
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    started_at?: Date
    
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    finished_at?: Date

    @IsOptional()
    @IsString()
    requirements?: string
}
