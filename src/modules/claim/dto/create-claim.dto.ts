import { urgency_options } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsInt, IsOptional, IsPositive, IsString, Max } from "class-validator";

export class CreateClaimDto {

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;
    
    @IsInt()
    @IsPositive()
    @Max(2147483647)
    detail_fk: number;

    @IsString()
    cause: string;

    @IsString()
    urgency: urgency_options;

    @IsDate()
    @Type(() => Date)
    reported_date: Date;
}
