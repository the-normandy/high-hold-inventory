import { inject, Injectable } from "@angular/core";
import { DataStore } from "../../core/data/data.store";
import { ItemData, ItemTree } from "../../core/data/item.model";

@Injectable({
    providedIn: 'root'
})
export class CraftService {
 
    private readonly data = inject(DataStore);
    private readonly itemLookup: CraftSearchableItem[] = [];

    constructor() {
        this.buildLookup();
    }
    
    buildLookup() {
        const traverse = (node: ItemTree | ItemData[], path: string[]) => {
            if (Array.isArray(node)) {
                for (const item of node) {
                    this.itemLookup.push({
                        path,
                        item
                    });
                }
                return;
            }

            for (const [key, child] of Object.entries(node)) {
                traverse(child, [...path, key]);
            }
        };

        traverse(this.data.craftData, []);
    }

    clearAndRebuild() {
        this.itemLookup.length = 0;
        this.buildLookup();
    }

    getAllItems(): CraftSearchableItem[] {
        return [...this.itemLookup];
    }

    findByName(name: string): CraftSearchableItem | undefined {
        const normalizedName = name.toLowerCase();
        return this.itemLookup.find(searchable => searchable.item.name.toLowerCase() === normalizedName);
    }
}

export interface CraftSearchableItem {
    path: string[];
    item: ItemData;
}