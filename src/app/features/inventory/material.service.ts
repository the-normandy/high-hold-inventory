import { Injectable, inject } from '@angular/core';
import { ItemData, ItemTree } from '../../core/data/item.model';
import { DataStore } from '../../core/data/data.store';

export interface SearchableItem {
    category: string;
    item: ItemData;
}

@Injectable({
    providedIn: 'root'
})
export class MaterialService {

    private readonly data = inject(DataStore);

    private readonly itemLookup = new Map<string, SearchableItem>();

    constructor() {
        this.buildLookup();
    }

    buildLookup() {
        const traverse = (node: ItemTree | ItemData[], path: string[]) => {
            if (Array.isArray(node)) {
                for (const item of node) {
                    this.itemLookup.set(item.name, {
                        category: path.join('/') || '',
                        item
                    });
                }
                return;
            }

            for (const [key, child] of Object.entries(node)) {
                traverse(child, [...path, key]);
            }
        };

        traverse(this.data.items, []);
    }

    clearAndRebuild() {
        this.itemLookup.clear();
        this.buildLookup();
    }

    getAllItems(): SearchableItem[] {
        return [...this.itemLookup.values()];
    }

    findByName(name: string): SearchableItem | undefined {
        return this.itemLookup.get(name);
    }
}