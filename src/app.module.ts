import { Module } from '@nestjs/common';
import { 
    OrderModule,
    OrderDetailModule,
    ClaimModule 
} from './modules';

@Module({
    imports: [
        OrderModule, 
        OrderDetailModule, 
        ClaimModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
