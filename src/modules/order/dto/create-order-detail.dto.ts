import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, Min } from 'class-validator';

export class CreateOrderDetailDto {

    client_fk: number;

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    order_fk: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    professional_fk?: number;

    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en el formato "YYYY-MM-DD"' })
    start_date: Date;
    
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en el formato "YYYY-MM-DD"' })
    finish_date: Date;
    
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Max(31)
    total_sessions: number = 0;

    @IsOptional()
    @IsInt()
    @IsPositive()
    sessions: number = 0;

    @IsOptional()
    @IsOptional()
    @IsNumber()
    @IsPositive()
    coinsurance: number = 0
    
    @IsOptional()
    @IsNumber()
    @IsPositive()
    value: number = 0
    
    @IsOptional()
    @IsNumber()
    @IsPositive()
    cost: number = 0
    
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en el formato "YYYY-MM-DD"' })
    started_at?: Date
    
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en el formato "YYYY-MM-DD"' })
    finished_at?: Date

    @IsOptional()
    @IsString()
    requirements?: string
}
