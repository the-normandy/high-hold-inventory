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

    craftData: Record<CraftCategory, Record<string, ItemData[]>> | [] = [];
    
    craftItems: CraftCategory[] = ['Alchemy', 'Blacksmithing', 'Leatherworking', 'Woodcarving'];

    items: Record<Category, ItemData[]> | [] = []



}