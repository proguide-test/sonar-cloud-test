import { Cart, DistribucionInfo } from "../../model/cart.model";

export interface CarritoPostergado extends Cart {
    carritoid: string;    
    productos: DistribucionInfoPostergado[];
}

export interface DistribucionInfoPostergado extends DistribucionInfo {
    username?: string;
}