import { Injectable } from "@angular/core";
import { ItemData } from "./item.model";
import { PricesFile } from "./data.service"

@Injectable({
    providedIn: 'root'
})
export class DataStore {

    load(data: PricesFile): void {
        this.items = data.materials;
        this.craftData = data.craft;
        this.craftItems = Object.keys(data.craft) as string[];
    }

    craftItems: string[] = [];

    items = {} as Record<string, ItemData[]>;
    craftData = {} as Record<string, Record<string, ItemData[]>>;
}