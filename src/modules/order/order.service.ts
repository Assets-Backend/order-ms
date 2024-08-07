import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto';
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
    }): Promise<order> { 

        // Cuando creo una orden, tambien debo crear el detalle de ella en order_detail
        const { updated_by, orderCreateInput: data } = params

        data.client_fk = currentClient.client_id
        data.updated_by = updated_by

        try {
            
            // Validar los datos de la orden
            await this.validate(currentClient, data)

            // Crear la orden
            return await this.order.create({ data })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    private async validate(
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

    async findAll(currentClient: ClientIds, params?: {
        orderWhereInput: Prisma.orderWhereInput,
        select?: Prisma.orderSelect,
        skip?: Prisma.orderFindManyArgs['skip'],
        take?: Prisma.orderFindManyArgs['take'],
    }): Promise<order[]> {

        const { orderWhereInput: where, select, skip, take } = params

        where.client_fk = currentClient.client_id

        try {
            return await this.order.findMany({ where, select, skip, take })
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async update(currentClient: ClientIds, params: {
        whereUniqueInput: Prisma.orderWhereUniqueInput,
        updated_by: order['updated_by'],
        orderUpdateInput: Prisma.orderUpdateInput,
    }): Promise<order> {

        const { whereUniqueInput: where, updated_by, orderUpdateInput: data } = params

        where.client_fk = currentClient.client_id
        data.updated_by = updated_by

        try {

            // Verifico que exista la orden y que perteza al cliente
            const order = await this.order.findUniqueOrThrow({ where })

            // Validar los datos de la orden
            Object.assign(order, data)
            await this.validate(currentClient, order)

            // Actualizar la orden
            return await this.order.update({ where, data })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async delete(currentClient: ClientIds, params: {
        orderWhereUniqueInput: Prisma.orderWhereUniqueInput,
        updated_by: number,
    }): Promise<order> {

        const { orderWhereUniqueInput: where, updated_by } = params
        const { order_id } = where
        
        where.client_fk = currentClient.client_id
        
        try {

            // Verifico que exista la orden y que perteza al cliente
            const order = await this.order.findUniqueOrThrow({ where })
            
            if (order.deleted_at) throw new RpcException({
                status: 404,
                message: 'La orden ya ha sido eliminado'
            });

            return await this.order.update({
                where: { order_id: order_id },
                data: { 
                    deleted_at: new Date(), 
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
}
