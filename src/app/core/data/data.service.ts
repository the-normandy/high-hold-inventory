import { Injectable, inject, signal } from '@angular/core';

import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
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
    private readonly loadError = signal<string | null>(null);

    readonly error = this.loadError.asReadonly();

    async load(): Promise<void> {
        try {
            const text = await readTextFile('prices.json', {baseDir: BaseDirectory.AppLocalData});
            const data = JSON.parse(text) as PricesFile;
            if (!data) {
                throw Error("Failed to locate prices.json.");
            }
            this.dataStore.load(data);
            this.loadError.set(null);
        } catch (error) {
            console.error(error);
            this.loadError.set('Failed to locate prices.json.')
        }
    }

    async save(data: PricesFile): Promise<void> {
        const json = JSON.stringify(data, null, 2);

        await writeTextFile(
            'prices.json',
            json,
            {
                baseDir: BaseDirectory.AppLocalData
            }
        );
    }

    async saveWebhook(url: string): Promise<void> {
        await writeTextFile(
            'webhook.json',
            JSON.stringify({ url }, null, 2),
            {
                baseDir: BaseDirectory.AppLocalData
            }
        );
        await this.loadWebhook();
    }

    async loadWebhook(): Promise<void> {
        try {
            const text = await readTextFile(
                'webhook.json',
                { baseDir: BaseDirectory.AppLocalData }
            );

            this.dataStore.webhook.set(JSON.parse(text).url ?? null);
        } catch {
            return;
        }
    }

}