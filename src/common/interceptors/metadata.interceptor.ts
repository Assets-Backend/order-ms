import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
  
@Injectable()
export class MetadataInterceptor implements NestInterceptor {

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        // Para contextos de microservicios, usa `switchToRpc()` en lugar de `switchToHttp()`
        const ctx = context.switchToRpc();
        const request = context.switchToHttp().getRequest();
        const data = ctx.getData(); // Obtén los datos del mensaje

        if (!data.currentClient) return next.handle();

        ctx.getContext()['metadata'] = data.currentClient;

        delete context.getArgByIndex(0).currentClient  

        return next.handle();
    }
}