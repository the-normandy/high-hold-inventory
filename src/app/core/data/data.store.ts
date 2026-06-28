import { Injectable } from "@angular/core";
import { AlchemyCategory, BlacksmithingCategory, Category, CraftCategory, ItemData, LeatherworkingCategory, WoodcarvingCategory } from "./item.model";
import { PricesFile } from "./data.service"

@Injectable({
    providedIn: 'root'
})
export class DataStore {

    load(data: PricesFile): void {

        this.items = data.materials;

        this.craftData = data.craft;

        this.craftItems =
            Object.keys(data.craft) as CraftCategory[];

    }

    
    craftItems: CraftCategory[] = ['Alchemy', 'Blacksmithing', 'Leatherworking', 'Woodcarving'];

    items = {} as Record<Category, ItemData[]>;
    craftData = {} as Record<CraftCategory, Record<string, ItemData[]>>;
    alchemyItems = {} as Record<AlchemyCategory, ItemData[]>;
    blacksmithingItems = {} as Record<BlacksmithingCategory, ItemData[]>;
    leatherworkingItems = {} as Record<LeatherworkingCategory, ItemData[]>;
    woodcarvingItems = {} as Record<WoodcarvingCategory, ItemData[]>;


}