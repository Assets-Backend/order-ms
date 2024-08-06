import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDetailDto, CreateOrderDto, UpdateOrderDto } from './dto';
import { order, order_detail, Prisma, PrismaClient } from '@prisma/client';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class OrderService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('OrderService');

    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy
    ) {
        super();
    }  

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to the database');
    }

    async createNewOrder(currentClient: ClientIds, params: {
        updated_by: order['updated_by'],
        orderCreateInput: Prisma.orderCreateInput,
        orderDetailCreateInput?: Prisma.order_detailCreateInput
    }): Promise<order> { 

        // Cuando creo una orden, tambien debo crear el detalle de ella en order_detail
        const { updated_by, orderCreateInput: data, orderDetailCreateInput } = params

        data.client_fk = currentClient.client_id
        data.updated_by = updated_by

        try {
            
            // Validar los datos de la orden
            await this.validateOrder(currentClient, data)

            // Crear la orden
            const newOrder = await this.order.create({ data })

            if (orderDetailCreateInput) await this.createOrderDetail(currentClient, {
                order_fk: newOrder.order_id,
                updated_by: data.updated_by,
                orderDetailCreateInput: orderDetailCreateInput
            })

            return newOrder

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async createOrderDetail(currentClient: ClientIds, params: {
        order_fk: order_detail['order_fk'],
        updated_by: order_detail['updated_by'],
        orderDetailCreateInput?: Prisma.order_detailCreateInput
    }): Promise<order_detail> {

        const { order_fk: order_id, updated_by, orderDetailCreateInput: data } = params
        const { professional_fk, total_sessions, start_date, finish_date, value, cost } = data

        data.client_fk = currentClient.client_id
        data.updated_by = updated_by
        data.order = { connect: { order_id } }

        try {

            // Compruebo que exista la orden
            const { frequency, company_fk, treatment_fk } = await this.order.findUnique({ 
                where: { order_id }, 
                select: { 
                    frequency: true, 
                    company_fk: true,
                    treatment_fk: true
                } 
            })

            // si totalSession es 0, calcularlo
            if (total_sessions === 0) data.total_sessions = this.calculateTotalSessions(
                frequency, start_date, finish_date
            )

            // Validar los datos del detalle de la orden
            await this.validateOrderDetail(currentClient, data)

            // si value es 0, obtenerlo de coordinator-ms
            if (value === 0) data.value = await firstValueFrom( 
                this.client.send('coordinator.find.companyHasTreatment', {
                    currentClient, compositeIdDto: { company_fk, treatment_fk }
                }).pipe( map(response => Number(response.value)) )
            );

            // si cost es 0, obtenerlo de coordinator-ms
            if (cost === 0) data.cost = await firstValueFrom( 
                this.client.send('coordinator.find.treatmentHasProfessional', {
                    currentClient, compositeIdDto: { company_fk, treatment_fk, professional_fk }
                }).pipe( map(response => Number(response.value)) )
            );

            // console.log('data', data)

            // Crear el detalle de la orden
            const x = await this.order_detail.create({ data })
            console.log('x', x)
            return x
            
        } catch (error) {
            console.log('error', error)
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    private async validateOrder(
        currentClient: ClientIds, 
        order: Prisma.orderCreateInput
    ): Promise<void> {
        
        // const { company_fk, treatment_fk, patient_fk } = order
        const { company_fk, treatment_fk, patient_fk }:any = order
        
        const coordinator = await firstValueFrom(
            // validar que existe el coordinador, tratamiento, paciente y empresa 
            // validar que el paciente pertenezca a la empresa
            this.client.send('coordinator.validate.coordinator', {currentClient,
                compositeIdDto: { company_fk, treatment_fk, patient_fk }
            })
        );

        if (!coordinator) throw new RpcException({
            status: 400,
            message: "Error en los datos de la orden"
        });
    }

    private async validateOrderDetail(
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
    
    // async findAll(currentClient: ClientIds, params?: {
    //     orderWhereInput: Prisma.orderWhereInput,
    //     select?: Prisma.orderSelect,
    //     skip?: Prisma.orderFindManyArgs['skip'],
    //     take?: Prisma.orderFindManyArgs['take'],
    // }): Promise<order[]> {

    //     const { orderWhereInput: where, select, skip, take } = params

    //     where.client_fk = currentClient.client_id

    //     try {

    //         return await this.order.findMany({ where, select, skip, take })

    //     } catch (error) {
    //         throw new RpcException({
    //             status: 400,
    //             message: error.message
    //         });
    //     }
    // }

    // async update(currentClient: ClientIds, params: {
    //     whereUniqueInput: Prisma.orderWhereUniqueInput,
    //     client_updated_by: number,
    //     data: Prisma.orderUpdateInput,
    // }): Promise<order> {

    //     const { whereUniqueInput: where, data, client_updated_by } = params

    //     where.client_fk = currentClient.client_id
    //     data.updated_by = client_updated_by

    //     try {

    //         return await this.order.update({ where, data })

    //     } catch (error) {
    //         throw new RpcException({
    //             status: 400,
    //             message: error.message
    //         });
    //     }
    // }

    // async delete(currentClient: ClientIds, params: {
    //     whereUniqueInput: Prisma.orderWhereUniqueInput,
    //     client_updated_by: number,
    // }): Promise<order> {

    //     const { whereUniqueInput: where, client_updated_by } = params
    //     const { order_id } = where
        
    //     where.client_fk = currentClient.client_id
        
    //     try {

    //         // Verifico que exista el paciente y que perteza al cliente
    //         const order = await this.order.findFirstOrThrow({ where })
            
    //         if (order.deleted_at) throw new RpcException({
    //             status: 404,
    //             message: 'La orden ya ha sido eliminado'
    //         });

    //         return await this.order.update({
    //             where: { order_id: order_id as number },
    //             data: { 
    //                 deleted_at: new Date(), 
    //                 updated_by: client_updated_by
    //             }
    //         }) 

    //     } catch (error) {
    //         throw new RpcException({
    //             status: 400,
    //             message: error.message
    //         });
    //     }
    // }
}
