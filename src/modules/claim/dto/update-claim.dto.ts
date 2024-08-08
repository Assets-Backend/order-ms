import { PartialType } from '@nestjs/mapped-types';
import { CreateClaimDto } from './create-claim.dto';
import { IsInt, IsPositive, Max } from 'class-validator';

export class UpdateClaimDto extends PartialType(CreateClaimDto) {

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    claim_id: number; 

    @IsInt()
    @IsPositive()
    @Max(2147483647)
    updated_by: number;
}
