export interface ItemData {
    name: string;
    price: number;
    labor?: number;
}

export interface ItemTree {
    [key: string]: ItemTree | ItemData[];
}