import { inject, Injectable } from "@angular/core";
import { DataStore } from "../../core/data/data.store";
import { ItemData } from "../../core/data/item.model";

@Injectable({
    providedIn: 'root'
})
export class CraftService {
 
    private readonly data = inject(DataStore);
    private readonly itemLookup = new Map<string, CraftSearchableItem>();

    constructor() {
        this.buildLookup();
    }
    
    buildLookup() {
        for (const [crafting, categories] of Object.entries(this.data.craftData)) {
            for (const [category, items] of Object.entries(categories)) {
                for (const item of items) {
                    this.itemLookup.set(item.name.toLowerCase(), {
                        craft: crafting as string,
                        category,
                        item
                    });
                }
            }
        }
    }

    clearAndRebuild() {
        this.itemLookup.clear();
        this.buildLookup();
    }

    getAllItems(): CraftSearchableItem[] {
        return [...this.itemLookup.values()];
    }

    findByName(name: string): CraftSearchableItem | undefined {
        return this.itemLookup.get(name.toLowerCase());
    }
}

export interface CraftSearchableItem {
    craft: string;
    category: string;
    item: ItemData;
}