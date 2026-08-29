import { Injectable, inject, signal } from '@angular/core';

import { exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import { DataStore } from './data.store';
import { ItemData, ItemTree } from './item.model';

export interface PricesFile {
    schema: number;
    materials: ItemTree;
    craft: ItemTree;
    [key: string]: ItemTree | number;
}

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly dataStore = inject(DataStore);
    private readonly loadError = signal<string | null>(null);
    private readonly missingFile = signal(false);

    readonly error = this.loadError.asReadonly();
    readonly isMissing = this.missingFile.asReadonly();

    async load(): Promise<void> {
        try {
            const fileExists = await exists('prices.json', { baseDir: BaseDirectory.AppLocalData });
            if (!fileExists) {
                this.missingFile.set(true);
                this.loadError.set('prices.json was not found.');
                return;
            }

            this.missingFile.set(false);
            const text = await readTextFile('prices.json', {baseDir: BaseDirectory.AppLocalData});
            const data = JSON.parse(text) as Partial<PricesFile>;
            if (
                typeof data.schema !== 'number'
                || !data.materials
                || typeof data.materials !== 'object'
                || Array.isArray(data.materials)
                || !data.craft
                || typeof data.craft !== 'object'
                || Array.isArray(data.craft)
            ) {
                throw new Error('prices.json does not contain the required roots.');
            }
            this.dataStore.load(data as PricesFile);
            this.loadError.set(null);
        } catch (error) {
            console.error(error);
            this.missingFile.set(false);
            this.loadError.set('prices.json could not be loaded.');
        }
    }

    async createInitialFile(): Promise<void> {
        const initialData: PricesFile = {
            schema: 1,
            materials: {},
            craft: {}
        };

        await this.save(initialData);
        await this.load();

        if (this.loadError()) {
            throw new Error(this.loadError()!);
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
        await writeTextFile('webhook.json', 
            JSON.stringify({ url }, null, 2), 
            { baseDir: BaseDirectory.AppLocalData }
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