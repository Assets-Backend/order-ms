import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClaimService } from './claim.service';
import { CreateClaimDto, UpdateClaimDto } from './dto';
import { CurrentClient } from 'src/common/decorators/current-client.decorator';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { claim } from '@prisma/client';
import { PaginationDto } from 'src/common/dto';

@Controller()
export class ClaimController {
  
    constructor(private readonly claimService: ClaimService) {}

    @MessagePattern('order.create.claim')
    create(
        @CurrentClient() currentClient: ClientIds,
        @Payload('createClaimDto') createClaimDto: CreateClaimDto,
    ): Promise<claim> {

        const { updated_by, detail_fk: detail_id, ...data }:any = createClaimDto

        return this.claimService.create(currentClient, {
            detailWhereUniqueInput: { detail_id },
            updated_by,
            data
        })
    }

    @MessagePattern('order.find.claim')
    findOne(
        @CurrentClient() currentClient: ClientIds,
        @Payload('claim_id') claim_id: number
    ): Promise<claim> {

        return this.claimService.findOneByUnique(currentClient, {
            claimWhereUniqueInput: { claim_id }
        });
    }

    @MessagePattern('order.find.claims')
    findAll(
        @CurrentClient() currentClient: ClientIds,
        @Payload('whereInput') whereInput: any,
        @Payload('paginationDto') paginationDto: PaginationDto
    ): Promise<claim[]> {

        const { limit: take, offset: skip } = paginationDto
        whereInput ? whereInput.deleted_at = null : whereInput = { deleted_at: null }

        return this.claimService.findAll(currentClient, {
            claimWhereInput: whereInput,
            skip,
            take
        })
    }

    @MessagePattern('order.update.claim')
    update(
        @CurrentClient() currentClient: ClientIds,
        @Payload('updateClaimDto') updateClaimDto: UpdateClaimDto
    ): Promise<claim> {

        const { claim_id, updated_by, ...data } = updateClaimDto

        return this.claimService.update(currentClient, {
            claimWhereUniqueInput: { claim_id },
            updated_by,
            data,
        })
    }

    @MessagePattern('order.delete.claim')
    delete(
        @CurrentClient() currentClient: ClientIds,
        @Payload('deleteClaimDto') deleteClaimDto: { claim_id: claim['claim_id'], updated_by: claim['client_fk'] }
    ): Promise<claim> {

        const { claim_id, updated_by } = deleteClaimDto
        
        return this.claimService.delete(currentClient, {
            claimWhereUniqueInput: { claim_id },
            updated_by,
        })
    }
}
