import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderDetailService } from './order_detail.service';
import { CreateDetailDto, UpdateDetailDto } from './dto';
import { order, order_detail } from '@prisma/client';
import { CurrentClient } from 'src/common/decorators/current-client.decorator';
import { ClientIds } from 'src/common/interface/client-ids.interface';
import { PaginationDto } from 'src/common/dto';

@Controller()
export class OrderDetailController {

    constructor(private readonly orderDetailService: OrderDetailService) {}

    @MessagePattern('order.create.detail')
    create(
        @CurrentClient() currentClient: ClientIds,
        @Payload('createDetailDto') createDetailDto: CreateDetailDto,
    ): Promise<order_detail> {

        const { updated_by, order_fk, ...order_detail }: any = createDetailDto

        return this.orderDetailService.create(currentClient, {
            order_fk,
            updated_by,
            orderDetailCreateInput: order_detail
        })
    }

    @MessagePattern('order.find.detail')
    findOne(
        @CurrentClient() currentClient: ClientIds,
        @Payload('detail_id') detail_id: number
    ): Promise<order_detail> {

        return this.orderDetailService.findOneByUnique(currentClient, {
            whereUniqueInput: { detail_id }
        });
    }
    
    @MessagePattern('order.findAll.details')
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

    @MessagePattern('order.update.detail')
    update(
        @CurrentClient() currentClient: ClientIds,
        @Payload('updateDetailDto') updateDetailDto: UpdateDetailDto
    ): Promise<order_detail> {

        const { detail_id, updated_by, ...order_detail } = updateDetailDto

        return this.orderDetailService.update(currentClient, {
            whereUniqueInput: { detail_id },
            updated_by,
            orderDetailUpdateInput: order_detail
        })
    }

    @MessagePattern('order.finalize.detail')
    finalize(
        @CurrentClient() currentClient: ClientIds,
        @Payload('deleteDetailDto') deleteDetailDto: { detail_id: order_detail['detail_id'], updated_by: order['client_fk'] }

    ): Promise<order_detail> {

        const { detail_id, updated_by } = deleteDetailDto

        return this.orderDetailService.finalize(currentClient, {
            whereUniqueInput: { detail_id },
            updated_by
        })
    }

    @MessagePattern('order.accept.detail')
    accept(
        @Payload('professional_id') professional_fk: order_detail['professional_fk'],
        @Payload('detail_id') detail_id: order_detail['detail_id'],
    ): Promise<order_detail> {
        return this.orderDetailService.accept({ professional_fk, detail_id })
    }

    @MessagePattern('order.totalOrders.detail')
    totalOrders(
        @Payload('company_id') company_id: order['company_fk'],
    ): Promise<number> {
        return this.orderDetailService.countByCompany({ company_id })
    }

    @MessagePattern('order.getDetails.detail')
    getProfessionalDetails(
        @Payload('professional_id') professional_fk: number,
        @Payload('paginationDto') paginationDto: PaginationDto
    ): Promise<order_detail[]> {

        const { limit: take, offset: skip } = paginationDto

        return this.orderDetailService.getProfessionalDetails({
            whereInput: { professional_fk, finished_at: null },
            skip,
            take
        })
    }

    @MessagePattern('order.getDetail.detail')
    getProfessionalDetail(
        @Payload('detail_id') detail_id: number,
        @Payload('professional_id') professional_fk: number,
    ): Promise<order_detail> {

        return this.orderDetailService.getProfessionalDetail({
            whereUniqueInput: { detail_id, professional_fk, finished_at: null }
        })
    }

    @MessagePattern('order.findPending.details')
    findPendingOrders(
        @Payload('client_fk') client_fk: number,
        @Payload('professional_id') professional_fk: number,
        @Payload('paginationDto') paginationDto: PaginationDto
    ): Promise<order_detail[]> {

        const { limit: take, offset: skip } = paginationDto

        return this.orderDetailService.findPendingOrders({
            client_fk,
            professional_fk,
            skip,
            take
        })
    }
    
    @MessagePattern('order.addSession.detail')
    addSession(
        @Payload('detail_id') detail_id: number,
        @Payload('professional_id') professional_fk: number,
    ): Promise<order_detail> {

        return this.orderDetailService.addSessionDetail({
            whereUniqueInput: { detail_id, professional_fk, finished_at: null }
        })
    }

}
