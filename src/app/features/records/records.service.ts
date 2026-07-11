import { Injectable } from "@angular/core";
import { CraftSubmission, EntryType, MaterialSubmission, RecordEntry } from "./records.model";
import { BaseDirectory, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
   
    private createMaterialRecord(material: MaterialSubmission, mode: string): RecordEntry {
        const entry = mode as EntryType;

        return {
            id: crypto.randomUUID(),
            entry: entry,
            source: 'material',
            timestamp: new Date().toISOString(),
            totalValue: material.items.reduce(
                (sum, item) => sum + item.item.price * item.quantity,
                0
            ),
            items: material.items.map(item => ({
                name: item.item.name,
                category: item.category,
                quantity: item.quantity,
                value: item.item.price
            }))
        };
    }

    private createCraftRecord(craft: CraftSubmission, mode: string): RecordEntry {
        const entry = mode as EntryType;

        return {
            id: crypto.randomUUID(),
            entry: entry,
            source: 'craft',
            timestamp: new Date().toISOString(),
            totalValue: craft.items.reduce(
                (sum, item) =>
                    sum +
                    (item.laborOnly ? item.item.labor! : item.item.price) *
                    item.quantity,
                0
            ),
            items: craft.items.map(item => ({
                name: item.item.name,
                category: item.category,
                quantity: item.quantity,
                value: item.laborOnly
                    ? item.item.labor!
                    : item.item.price
            }))
        };
    }

    private validate(mode: string) {
        return mode !== 'deposit' && mode !== 'withdraw';
    }

    async recordMaterialSubmission(material: MaterialSubmission, mode: string): Promise<void> {
        if (this.validate(mode)) return;

        const entry = this.createMaterialRecord(material, mode);
        return this.writeRecord(entry);
    }

    async recordCraftSubmission(craft: CraftSubmission, mode: string): Promise<void> {
        if (this.validate(mode)) return;

        const entry = this.createCraftRecord(craft, mode);
        return this.writeRecord(entry);
    }

    async writeRecord(entry: RecordEntry): Promise<void> {
        let records: RecordEntry[] = [];

        if (await exists('ledger.json', { baseDir: BaseDirectory.AppLocalData })) {
            const text = await readTextFile('ledger.json', {
                baseDir: BaseDirectory.AppLocalData
            });

            if (text.trim().length > 0) {
                records = JSON.parse(text) as RecordEntry[];
            }
        }

        records.push(entry);
        records.sort(
            (a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        await writeTextFile('ledger.json', JSON.stringify(records, null, 2), {baseDir: BaseDirectory.AppLocalData});
    }

    async load(): Promise<RecordEntry[]> {
        if (!(await exists('ledger.json', { baseDir: BaseDirectory.AppLocalData }))) {
            await writeTextFile(
                'ledger.json',
                '[]',
                { baseDir: BaseDirectory.AppLocalData }
            );

            return [];
        }

        const text = await readTextFile('ledger.json', {
            baseDir: BaseDirectory.AppLocalData
        });

        return JSON.parse(text) as RecordEntry[];
    }
    
    async delete(id: string): Promise<void> {
        try {
            const text = await readTextFile('ledger.json', {
                baseDir: BaseDirectory.AppLocalData
            });

            const records = JSON.parse(text) as RecordEntry[];

            const filtered = records.filter(record => record.id !== id);

            await writeTextFile(
                'ledger.json',
                JSON.stringify(filtered, null, 2),
                {
                    baseDir: BaseDirectory.AppLocalData
                }
            );
        } catch (e) {
            throw new Error('Failed to delete ledger entry.');
        }
    }
}