import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateClaimDto, UpdateClaimDto } from './dto';
import { claim, Prisma, PrismaClient } from '@prisma/client';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ClaimService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('ClaimService');

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to the database');
    }

    async create(currentClient: ClientIds, params: {
        updated_by: claim['updated_by'],
        detailWhereUniqueInput: Prisma.order_detailWhereUniqueInput,
        data: Prisma.claimCreateInput
    }): Promise<claim> { 

        const { updated_by, detailWhereUniqueInput, data } = params

        data.client_fk = currentClient.client_id
        data.updated_by = updated_by
        data.order_detail = { connect: detailWhereUniqueInput }

        try {

            // Compruebo que exista el detalle y que perteza al cliente
            await this.order_detail.findUniqueOrThrow({ 
                where: { ...detailWhereUniqueInput, client_fk: currentClient.client_id }, 
            })

            // Creo la reclamación
            return await this.claim.create({ data })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async findOneByUnique(currentClient: ClientIds, params: {
        claimWhereUniqueInput: Prisma.claimWhereUniqueInput,
        select?: Prisma.claimSelect
    }): Promise<claim> {

        const {claimWhereUniqueInput: where, select} = params

        where.client_fk = currentClient.client_id

        try {
            
            return await this.claim.findUniqueOrThrow({ where, select })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async findByDetail(currentClient: ClientIds, params: {
        claimWhereInput: Prisma.claimWhereInput,
        select?: Prisma.claimSelect,
        skip?: Prisma.claimFindManyArgs['skip'],
        take?: Prisma.claimFindManyArgs['take'],
    }): Promise<claim[]> {

        const { claimWhereInput: where, select, skip, take } = params

        where.client_fk = currentClient.client_id

        try {
            
            return await this.claim.findMany({ where, select, skip, take })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }
    
    async findAll(currentClient: ClientIds, params?: {
        claimWhereInput: Prisma.claimWhereInput,
        select?: Prisma.claimSelect,
        skip?: Prisma.claimFindManyArgs['skip'],
        take?: Prisma.claimFindManyArgs['take'],
    }): Promise<claim[]> {

        const { claimWhereInput: where, select, skip, take } = params

        where.client_fk = currentClient.client_id

        try {

            return await this.claim.findMany({ where, select, skip, take })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async update(currentClient: ClientIds, params: {
        claimWhereUniqueInput: Prisma.claimWhereUniqueInput,
        updated_by: claim['updated_by'],
        data: Prisma.claimUpdateInput,
    }): Promise<claim> {

        const { claimWhereUniqueInput: where, data, updated_by } = params

        where.client_fk = currentClient.client_id
        data.updated_by = updated_by

        try {

            return await this.claim.update({ where, data })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async delete(currentClient: ClientIds, params: {
        claimWhereUniqueInput: Prisma.claimWhereUniqueInput,
        updated_by: claim['updated_by'],
    }): Promise<claim> {

        const { claimWhereUniqueInput, updated_by } = params
        const { claim_id } = claimWhereUniqueInput
        
        claimWhereUniqueInput.client_fk = currentClient.client_id
        
        try {

            // Compruebo que exista el reclamo y que perteza al cliente
            const claim = await this.claim.findUniqueOrThrow({ 
                where: { ...claimWhereUniqueInput, client_fk: currentClient.client_id }, 
            })
            
            if (claim.deleted_at) throw new RpcException({
                status: 404,
                message: 'El reclamo ya ha sido eliminado'
            });

            return await this.claim.update({
                where: { claim_id },
                data: { 
                    deleted_at: new Date(), 
                    updated_by
                }
            }) 

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }
}
