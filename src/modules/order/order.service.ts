import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { order, Prisma, PrismaClient } from '@prisma/client';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

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
        client_updated_by: number,
        order: CreateOrderDto
    }): Promise<order> { 

        // Cuando creo una orden, tambien debo crear el detalle de ella en order_detail

        const { client_updated_by, order } = params
        const { company_fk, patient_fk, treatment_fk, frequency, order_detail } = order
        const { professional_fk, total_sessions, start_date, finish_date } = order_detail

        order.client_fk = currentClient.client_id
        order.updated_by = client_updated_by

        order_detail ? order_detail.client_fk = currentClient.client_id : null
        order_detail ? order_detail.updated_by = client_updated_by : null
                    
        try {

            // Validar los datos de la orden
            const orderValidate = await this.validateOrder(currentClient, order)
            
            if (orderValidate) throw new RpcException({
                status: 400,
                message: "Error en los datos de la orden"
            });

            // si totalSession es 0, calcularlo
            if (total_sessions === 0) order_detail.total_sessions = this.calculateTotalSessions(
                frequency, start_date, finish_date
            )

            // si value es 0, obtenerlo de coordinator-ms
            if (value === 0) order_detail.value = await firstValueFrom( 
                this.client.send('coordinator.find.companyHasTreatment', {
                    currentClient, compositeIdDto: { company_fk, treatment_fk }
                })
            );

            // si cost es 0, obtenerlo de coordinator-ms
            if (cost === 0) order_detail.cost = await firstValueFrom( 
                this.client.send('coordinator.find.treatmentHasProfessional', {
                    currentClient, compositeIdDto: { company_fk, treatment_fk, professional_fk }
                })
            );

            // Crear la orden
            return await this.order.create({
                data:{
                    ...order,
                    order_detail: { create: {...order_detail } }
                }
            })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    private async validateOrder(currentClient: ClientIds, order: CreateOrderDto): Promise<boolean> {
        
        const { order_detail, company_fk, treatment_fk, patient_fk } = order
        const { total_sessions } = order_detail
        
        const coordinator = await firstValueFrom(
            // validar que existe el coordinador, tratamiento, paciente y empresa 
            // validar que el paciente pertenezca a la empresa
            this.client.send({ cmd: 'coordinator.validate.coordinator' }, {currentClient,
                compositeIdDto: { company_fk, treatment_fk, patient_fk }
            })
        );

        if (!coordinator) throw new RpcException({
            status: 400,
            message: "Error en los datos de la orden"
        });
        
        if (order_detail) {
            
            const { professional_fk, sessions } = order_detail

            // sessions no puede ser mayor que totalSession
            if (sessions && sessions > total_sessions) return false

            if (professional_fk) {
                
                // Valido que exista la relacion con el profesional
                const professional: boolean = await firstValueFrom( 
                    this.client.send({ cmd: 'community.find.professional' }, {})
                );

                if (!professional) throw new RpcException({
                    status: 400,
                    message: "El profesional no existe"
                });

            }
        }

        return true
    }

    async findOneByUnique(currentClient: ClientIds, params: {
        orderWhereUniqueInput: Prisma.orderWhereUniqueInput,
        select?: Prisma.orderSelect
    }): Promise<order> {

        const {orderWhereUniqueInput: where, select} = params

        where.client_fk = currentClient.client_id

        try {
            
            return await this.order.findUniqueOrThrow({ where, select })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
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
        client_updated_by: number,
        data: Prisma.orderUpdateInput,
    }): Promise<order> {

        const { whereUniqueInput: where, data, client_updated_by } = params

        where.client_fk = currentClient.client_id
        data.updated_by = client_updated_by

        try {

            return await this.order.update({ where, data })

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            });
        }
    }

    async delete(currentClient: ClientIds, params: {
        whereUniqueInput: Prisma.orderWhereUniqueInput,
        client_updated_by: number,
    }): Promise<order> {

        const { whereUniqueInput: where, client_updated_by } = params
        const { order_id } = where
        
        where.client_fk = currentClient.client_id
        
        try {

            // Verifico que exista el paciente y que perteza al cliente
            const order = await this.order.findFirstOrThrow({ where })
            
            if (order.deleted_at) throw new RpcException({
                status: 404,
                message: 'La orden ya ha sido eliminado'
            });

            return await this.order.update({
                where: { order_id: order_id as number },
                data: { 
                    deleted_at: new Date(), 
                    updated_by: client_updated_by
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
