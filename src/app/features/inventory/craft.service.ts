import { inject, Injectable } from "@angular/core";
import { DataStore } from "../../core/data/data.store";
import { ItemData, ItemTree } from "../../core/data/item.model";

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
        const traverse = (node: ItemTree | ItemData[], craft: string, path: string[]) => {
            if (Array.isArray(node)) {
                for (const item of node) {
                    this.itemLookup.set(item.name.toLowerCase(), {
                        craft,
                        category: path.join('/') || '',
                        item
                    });
                }
                return;
            }

            for (const [key, child] of Object.entries(node)) {
                traverse(child, craft, [...path, key]);
            }
        };

        for (const [crafting, categories] of Object.entries(this.data.craftData)) {
            traverse(categories, crafting as string, []);
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