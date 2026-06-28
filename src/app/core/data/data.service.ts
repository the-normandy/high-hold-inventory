import { Injectable, inject } from '@angular/core';

import { readTextFile } from '@tauri-apps/plugin-fs';
import { executableDir, join, appLocalDataDir, appDataDir } from '@tauri-apps/api/path';
import { DataStore } from './data.store';
import { Category, CraftCategory, ItemData } from './item.model';

export interface PricesFile {
    schema: number;

    materials: Record<Category, ItemData[]>;
    craft: Record<CraftCategory, Record<string, ItemData[]>>;
}

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private readonly dataStore = inject(DataStore);

    async load(): Promise<void> {

        try {

            const directory = await appLocalDataDir();

            const file = await join(directory, 'prices.json');

            const text = await readTextFile(file);

            const data = JSON.parse(text) as PricesFile;

            if (data) {
                throw Error("Failed to locate prices.json");
            }

            this.dataStore.load(data);

        } catch (error) {

            console.error(error);

            throw new Error(
                'Unable to load prices.json.'
            );
        }

    }

}