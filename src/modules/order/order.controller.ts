import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDetailDto, CreateOrderDto, UpdateOrderDto } from './dto';
import { CurrentClient } from 'src/common/decorators/current-client.decorator';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { order, order_detail } from '@prisma/client';

@Controller()
export class OrderController {
  
    constructor(private readonly orderService: OrderService) {}

    @MessagePattern('order.create.order')
    create(
        @CurrentClient() currentClient: ClientIds,
        @Payload('createOrderDto') createOrderDto: CreateOrderDto,
    ): Promise<order> {

        const { updated_by, order_detail, ...order }: any = createOrderDto

        return this.orderService.createNewOrder(currentClient, {
            updated_by,
            orderCreateInput: order,
            orderDetailCreateInput: order_detail
        })
    }

    @MessagePattern('order.create.orderDetail')
    createDetail(
        @CurrentClient() currentClient: ClientIds,
        @Payload('createOrderDetailDto') createOrderDetailDto: CreateOrderDetailDto,
    ): Promise<order_detail> {

        const { updated_by, order_fk, ...order_detail }: any = createOrderDetailDto

        return this.orderService.createOrderDetail(currentClient, {
            order_fk,
            updated_by,
            orderDetailCreateInput: order_detail
        })
    }

    @MessagePattern('order.find.order')
    findOne(
        @CurrentClient() currentClient: ClientIds,
        @Payload('detail_id') detail_id: number
    ): Promise<order_detail> {

        return this.orderService.findOneByUnique(currentClient, {
            whereUniqueInput: { detail_id }
        });
    }

    // @MessagePattern('coordinator.findByCompany.patient')
    // findByCompany(
    //     @CurrentClient() currentClient: ClientIds,
    //     @Payload('company_fk') company_fk: number,
    //     @Payload('paginationDto') paginationDto: PaginationDto
    // ): Promise<patient[]> {

    //     const { limit: take, offset: skip } = paginationDto

    //     return this.patientService.findByCompany(currentClient, {
    //         patientWhereInput: { company_fk },
    //         skip,
    //         take
    //     });
    // }

    // @MessagePattern('coordinator.find.patients')
    // findAll(
    //     @CurrentClient() currentClient: ClientIds,
    //     @Payload('paginationDto') paginationDto: PaginationDto
    // ): Promise<patient[]> {

    //     const { limit: take, offset: skip } = paginationDto

    //     return this.patientService.findAll(currentClient, {
    //         patientWhereInput: { deleted_at: null },
    //         skip,
    //         take
    //     })
    // }

    // @MessagePattern('coordinator.update.patient')
    // update(
    //     @CurrentClient() currentClient: ClientIds,
    //     @Payload('updatePatientDto') updatePatientDto: UpdatePatientDto
    // ): Promise<patient> {

    //     const { patient_id, updated_by: client_id, ...data } = updatePatientDto

    //     return this.patientService.update(currentClient, {
    //         whereUniqueInput: { patient_id },
    //         client_updated_by: { client_id  },
    //         data,
    //     })
    // }

    // @MessagePattern('coordinator.delete.patient')
    // delete(
    //     @CurrentClient() currentClient: ClientIds,
    //     @Payload('deletePatientDto') deletePatientDto: { patient_id: patient['patient_id'], updated_by: client['client_id'] }
    // ): Promise<patient> {

    //     const { patient_id, updated_by: client_id } = deletePatientDto
        
    //     return this.patientService.delete(currentClient, {
    //         whereUniqueInput: { patient_id },
    //         client_updated_by: { client_id }
    //     })
    // }

}
