import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";
import { ClientIds } from "../interface/client-ids.interface";

export const CurrentClient = createParamDecorator(
    (data: keyof ClientIds, context: ExecutionContext) => {
        
        const ctx = context.switchToRpc();
        const currentClient: ClientIds = ctx.getContext().metadata; // Obtén los datos del mensaje

        if (!currentClient)
            throw new InternalServerErrorException('Client not found in request object');

        return data ? currentClient[data] : currentClient;
    }
)