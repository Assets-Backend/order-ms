import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { CurrentClient } from 'src/common/decorators/current-client.decorator';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { order } from '@prisma/client';
import { PaginationDto } from 'src/common/dto';

@Controller()
export class OrderController {
  
    constructor(private readonly orderService: OrderService) {}

    @MessagePattern('order.create.order')
    create(
        @CurrentClient() currentClient: ClientIds,
        @Payload('createOrderDto') createOrderDto: CreateOrderDto,
    ): Promise<order> {

        const { updated_by, ...order }: any = createOrderDto

        return this.orderService.createNewOrder(currentClient, {
            updated_by,
            orderCreateInput: order,
        })
    }

    @MessagePattern('order.find.orders')
    findAll(
        @CurrentClient() currentClient: ClientIds,
        @Payload('whereInput') whereInput: any,
        @Payload('paginationDto') paginationDto: PaginationDto
    ): Promise<order[]> {

        const { limit: take, offset: skip } = paginationDto
        whereInput ? whereInput.deleted_at = null : whereInput = { deleted_at: null }

        return this.orderService.findAll(currentClient, {
            orderWhereInput: whereInput,
            skip,
            take
        })
    }

    @MessagePattern('order.update.order')
    update(
        @CurrentClient() currentClient: ClientIds,
        @Payload('updateOrderDto') updateOrderDto: UpdateOrderDto
    ): Promise<order> {

        const { order_id, updated_by, ...order } = updateOrderDto

        return this.orderService.update(currentClient, {
            whereUniqueInput: { order_id },
            updated_by,
            orderUpdateInput: order,
        })
    }

    @MessagePattern('order.delete.order')
    delete(
        @CurrentClient() currentClient: ClientIds,
        @Payload('deleteOrderDto') deleteOrderDto: { order_id: order['order_id'], updated_by: order['client_fk'] }
    ): Promise<order> {

        const { order_id, updated_by } = deleteOrderDto
        
        return this.orderService.delete(currentClient, {
            orderWhereUniqueInput: { order_id },
            updated_by
        })
    }
}
