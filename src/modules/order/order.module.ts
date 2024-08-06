import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { NatsModule } from 'src/transport/nats.module';

@Module({
    imports: [NatsModule],
    controllers: [OrderController],
    providers: [OrderService],
})
export class OrderModule {}
