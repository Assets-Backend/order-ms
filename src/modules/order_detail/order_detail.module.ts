import { Module } from '@nestjs/common';
import { OrderDetailService } from './order_detail.service';
import { OrderDetailController } from './order_detail.controller';
import { NatsModule } from 'src/transport/nats.module';

@Module({
    imports: [NatsModule],
    controllers: [OrderDetailController],
    providers: [OrderDetailService],
})
export class OrderDetailModule {}
