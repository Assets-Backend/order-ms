import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateDetailDto, UpdateDetailDto } from './dto';
import { order, order_detail, Prisma, PrismaClient } from '@prisma/client';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class OrderDetailService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('OrderDetailService');

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy
    ) {
        super();
    }  

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to the database');
    }

    async create(currentClient: ClientIds, params: {
        order_fk: order_detail['order_fk'],
        updated_by: order_detail['updated_by'],
        orderDetailCreateInput: Prisma.order_detailCreateInput
    }): Promise<order_detail> {

        const { order_fk: order_id, updated_by, orderDetailCreateInput: data } = params
        const { professional_fk, total_sessions, start_date, finish_date, value, cost } = data

        data.client_fk = currentClient.client_id
        data.updated_by = updated_by
        data.order = { connect: { order_id } }

        try {

            // Compruebo que exista la orden y que perteza al cliente
            const { frequency, company_fk, treatment_fk } = await this.order.findUniqueOrThrow({ 
                where: { order_id, client_fk: currentClient.client_id }, 
                select: { 
                    frequency: true, 
                    company_fk: true,
                    treatment_fk: true
                } 
            })

            // si totalSession es 0, calcularlo
            if (!total_sessions) data.total_sessions = this.calculateTotalSessions(
                frequency, start_date, finish_date
            )

            // Validar los datos del detalle de la orden
            await this.validate(currentClient, data)

            // si value es 0, obtenerlo de coordinator-ms
            if (!value) data.value = await firstValueFrom( 
                this.client.send('coordinator.getValue.companyHasTreatment', {
                    currentClient, compositeIdDto: { company_fk, treatment_fk }
                }).pipe( map(response => Number(response.value)) )
            );

            // si cost es 0, obtenerlo de coordinator-ms
            if (!cost && professional_fk) data.cost = await firstValueFrom( 
                this.client.send('coordinator.getValue.treatmentHasProfessional', {
                    currentClient, compositeIdDto: { company_fk, treatment_fk, professional_fk }
                }).pipe( map(response => Number(response.value)) )
            );

            // Crear el detalle de la orden
            return await this.order_detail.create({ data })
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    private async validate(
        currentClient: ClientIds, 
        detail: Prisma.order_detailCreateInput
    ): Promise<void> {
        
        if (!detail) return 

        // const { professional_fk, sessions, total_sessions } = detail
        const { professional_fk, sessions, total_sessions }:any = detail
        
        // sessions no puede ser mayor que totalSession
        if (sessions && sessions > total_sessions) throw new RpcException({
            status: 400,
            message: "Error en los datos de la orden"
        });
        
        if (!professional_fk) return  

        const { client_id: client_fk } = currentClient
        
        // Valido que exista la relacion con el profesional
        firstValueFrom( 
            this.client.send('community.find.professional', { 
                relation: { client_fk, professional_fk} 
            })
        );
    }

    private calculateTotalSessions(
        frequency: order['frequency'], 
        start_date: string | Date,
        finish_date: string | Date
    ): number {

        const start_date_ms = new Date(start_date).getTime();
        const finish_date_ms = new Date(finish_date).getTime();
        const days = Math.round((finish_date_ms - start_date_ms) / (1000 * 60 * 60 * 24));

        return Math.round((days / 7) * frequency);
    }

    async findOneByUnique(currentClient: ClientIds, params: {
        whereUniqueInput: Prisma.order_detailWhereUniqueInput,
        select?: Prisma.order_detailSelect
    }): Promise<order_detail> {

        const {whereUniqueInput: where, select} = params

        where.client_fk = currentClient.client_id

        try {
            
            return await this.order_detail.findUniqueOrThrow({ where, select })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async findAll(currentClient: ClientIds, params?: {
        whereInput: Prisma.order_detailWhereInput,
        select?: Prisma.order_detailSelect,
        skip?: Prisma.order_detailFindManyArgs['skip'],
        take?: Prisma.order_detailFindManyArgs['take'],
    }): Promise<order_detail[]> {

        const { whereInput: where, select, skip, take } = params

        where.client_fk = currentClient.client_id

        try {
            return await this.order_detail.findMany({ where, select, skip, take })
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async update(currentClient: ClientIds, params: {
        whereUniqueInput: Prisma.order_detailWhereUniqueInput,
        updated_by: order['updated_by'],
        orderDetailUpdateInput: Prisma.order_detailUpdateInput,
    }): Promise<order_detail> {

        const { whereUniqueInput: where, updated_by, orderDetailUpdateInput: data } = params

        where.client_fk = currentClient.client_id
        data.updated_by = updated_by

        try {

            // Compruebo que exista el detalle de la orden
            const { order, ...order_detail } = await this.order_detail.findUniqueOrThrow({ 
                where,
                include: { 
                    order: {
                        select: {
                            frequency: true, 
                        }
                    }
                } 
            })

            const { frequency,  } = order
            const { detail_id, total_sessions, start_date, finish_date } = order_detail

            // si totalSession es 0, calcularlo
            if (total_sessions === 0) data.total_sessions = this.calculateTotalSessions(
                frequency, start_date, finish_date
            )

            // Validar los datos del detalle de la orden
            Object.assign(order_detail, data)
            await this.validate(currentClient, order_detail)

            // Actualizar el detalle de la orden
            return await this.order_detail.update({ 
                where: {detail_id}, 
                data 
            })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async finalize(currentClient: ClientIds, params: {
        whereUniqueInput: Prisma.order_detailWhereUniqueInput,
        updated_by: number,
    }): Promise<order_detail> {

        const { whereUniqueInput: where, updated_by } = params
        const { detail_id } = where
        
        where.client_fk = currentClient.client_id
        
        try {

            // Verifico que exista la orden y que perteza al cliente
            const order_detail = await this.order_detail.findUniqueOrThrow({ where })
            
            if (order_detail.finished_at) throw new RpcException({
                status: 404,
                message: 'La orden ya ha sido eliminado'
            });

            return await this.order_detail.update({
                where: { detail_id },
                data: { 
                    finished_at: new Date(), 
                    updated_by: updated_by
                }
            }) 

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async accept(params: {
        professional_fk: order_detail['professional_fk'],
        detail_id: order_detail['detail_id'],
    }): Promise<order_detail> {

        const { professional_fk, detail_id } = params
        
        try {

            // Verifico que exista el detalle de la orden y que no haya sido finalizado
            const { client_fk } = await this.order_detail.findUniqueOrThrow({ 
                where: { detail_id, professional_fk: null, finished_at: null } 
            })

            // Verifico que el profesional tenga una relacion activa con el coordinador
            await firstValueFrom( 
                this.client.send('community.find.professional', { 
                    relation: { client_fk, professional_fk} 
                })
            );

            return await this.order_detail.update({
                where: { detail_id },
                data: { professional_fk }
            })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async countByCompany(params: {
        company_id: order['company_fk']
    }): Promise<number> {

        const { company_id } = params

        try {

            return await this.order_detail.count({
                where: { 
                    order: { company_fk: company_id },
                    finished_at: null
                }
            });

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async getProfessionalDetails(params: {
        whereInput: Prisma.order_detailWhereInput,
        select?: Prisma.order_detailSelect,
        skip?: Prisma.order_detailFindManyArgs['skip'],
        take?: Prisma.order_detailFindManyArgs['take'],
    }): Promise<order_detail[]> {

        const { whereInput: where, select, skip, take } = params

        try {
            return await this.order_detail.findMany({ where, select, skip, take })
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async getProfessionalDetail(params: {
        whereUniqueInput: Prisma.order_detailWhereUniqueInput,
        select?: Prisma.order_detailSelect,
    }): Promise<order_detail> {

        const { whereUniqueInput: where, select } = params

        try {
            return await this.order_detail.findUniqueOrThrow({ where, select })
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async findPendingOrders(params: {
        professional_fk: order_detail['professional_fk'],
        client_fk: order_detail['client_fk'],
        select?: Prisma.order_detailSelect,
        skip?: Prisma.order_detailFindManyArgs['skip'],
        take?: Prisma.order_detailFindManyArgs['take'],
    }): Promise<order_detail[]> {

        const { professional_fk, client_fk, select, skip, take } = params

        try {

            // Verifico que la relacion entre el cliente y el profesional exista
            await firstValueFrom( 
                this.client.send('community.find.professional', { 
                    relation: { client_fk, professional_fk} 
                })
            );

            return await this.order_detail.findMany({ 
                where: { client_fk, professional_fk: null, finished_at: null }, 
                select, 
                skip, 
                take 
            })
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async addSessionDetail(params: {
        whereUniqueInput: Prisma.order_detailWhereUniqueInput,
        select?: Prisma.order_detailSelect,
    }): Promise<order_detail> {

        const { whereUniqueInput: where, select } = params

        try {

            return await this.order_detail.update({ where, select, data: {
                sessions: { increment: 1 }
            } })
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }
}
