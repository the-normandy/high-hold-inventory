import { Injectable, inject } from '@angular/core';
import { ItemData } from '../../core/data/item.model';
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
        for (const [category, items] of Object.entries(this.data.items)) {
            for (const item of items) {
                this.itemLookup.set(item.name, {
                    category: category as string,
                    item
                });
            }
        }
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