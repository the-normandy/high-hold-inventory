import { Injectable, inject } from '@angular/core';

import { readTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { DataStore } from './data.store';
import { ItemData } from './item.model';

export interface PricesFile {
    schema: number;

    materials: Record<string, ItemData[]>;
    craft: Record<string, Record<string, ItemData[]>>;
}

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly dataStore = inject(DataStore);

    async load(): Promise<void> {
        try {
            const text = await readTextFile('prices.json', {baseDir: BaseDirectory.AppLocalData});
            const data = JSON.parse(text) as PricesFile;

            if (!data) {
                throw Error("Failed to locate prices.json");
            }

            this.dataStore.load(data);

        } catch (error) {
            console.error(error);
            throw new Error('Unable to load prices.json.');
        }
    }

}