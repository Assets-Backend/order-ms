import { IsInt, IsString } from "class-validator";

export class ClientIds {
    
    @IsString()
    mongo_id: string;

    @IsInt()
    client_id: number;
}