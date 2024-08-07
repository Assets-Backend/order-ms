import { Module } from '@nestjs/common';
import { OrderModule, OrderDetailModule } from './modules';

@Module({
    imports: [OrderModule, OrderDetailModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
