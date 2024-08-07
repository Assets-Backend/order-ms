import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderDetailService } from './order_detail.service';
import { CreateOrderDetailDto, UpdateOrderDetailDto } from './dto';
import { order, order_detail } from '@prisma/client';
import { CurrentClient } from 'src/common/decorators/current-client.decorator';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { PaginationDto } from 'src/common/dto';

@Controller()
export class OrderDetailController {

    constructor(private readonly orderDetailService: OrderDetailService) {}

    @MessagePattern('order.create.orderDetail')
    create(
        @CurrentClient() currentClient: ClientIds,
        @Payload('createOrderDetailDto') createOrderDetailDto: CreateOrderDetailDto,
    ): Promise<order_detail> {

        const { updated_by, order_fk, ...order_detail }: any = createOrderDetailDto

        return this.orderDetailService.create(currentClient, {
            order_fk,
            updated_by,
            orderDetailCreateInput: order_detail
        })
    }

    @MessagePattern('order.find.orderDetail')
    findOne(
        @CurrentClient() currentClient: ClientIds,
        @Payload('detail_id') detail_id: number
    ): Promise<order_detail> {

        return this.orderDetailService.findOneByUnique(currentClient, {
            whereUniqueInput: { detail_id }
        });
    }
    
    @MessagePattern('order.find.orderDetails')
    findAll(
        @CurrentClient() currentClient: ClientIds,
        @Payload('whereInput') whereInput: any,
        @Payload('paginationDto') paginationDto: PaginationDto
    ): Promise<order_detail[]> {

        const { limit: take, offset: skip } = paginationDto
        whereInput ? whereInput.finished_at = null : whereInput = { finished_at: null }

        return this.orderDetailService.findAll(currentClient, {
            whereInput,
            skip,
            take
        })
    }

    @MessagePattern('order.update.orderDetail')
    update(
        @CurrentClient() currentClient: ClientIds,
        @Payload('updateOrderDetailDto') updateOrderDetailDto: UpdateOrderDetailDto
    ): Promise<order_detail> {

        const { detail_id, updated_by, ...order_detail } = updateOrderDetailDto

        return this.orderDetailService.update(currentClient, {
            whereUniqueInput: { detail_id },
            updated_by,
            orderDetailUpdateInput: order_detail
        })
    }

    @MessagePattern('order.finalize.orderDetail')
    finalize(
        @CurrentClient() currentClient: ClientIds,
        @Payload('deleteOrderDetailDto') deleteOrderDetailDto: { detail_id: order_detail['detail_id'], updated_by: order['client_fk'] }

    ): Promise<order_detail> {

        const { detail_id, updated_by } = deleteOrderDetailDto

        return this.orderDetailService.finalize(currentClient, {
            whereUniqueInput: { detail_id },
            updated_by
        })
    }

    @MessagePattern('order.totalOrders.orderDetail')
    totalOrders(
        @Payload('company_id') company_id: order['company_fk'],
    ): Promise<number> {
        return this.orderDetailService.countByCompany({ company_id })
    }
}
