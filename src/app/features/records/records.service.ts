import { Injectable } from "@angular/core";
import { CraftSubmission, EntryType, MaterialSubmission, RecordEntry } from "./records.model";

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
   

    private createMaterialRecord(material: MaterialSubmission, mode: string): RecordEntry {
        const entry = mode as EntryType;

        return {
            id: crypto.randomUUID(),
            entry: entry,
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

    private getFileName(mode: string): string | null {
        switch(mode) {
            case 'deposit':
                return 'ledger-deposit.json';
            case 'withdraw':
                return 'ledger-withdraw.json';
            default:
                return null;
        }
    }

    async recordMaterialSubmission(material: MaterialSubmission, mode: string): Promise<void> {
        const filename = this.getFileName(mode);
        if (!filename) return;

        const entry = this.createMaterialRecord(material, mode);
        return this.writeRecord(entry, filename);
    }

    async recordCraftSubmission(craft: CraftSubmission, mode: string): Promise<void> {
        const filename = this.getFileName(mode);
        if (!filename) return;

        const entry = this.createCraftRecord(craft, mode);
        return this.writeRecord(entry, filename);
    }

    async writeRecord(entry: RecordEntry, filename: string): Promise<void> {
        // Tauri write to file, to implement
    }


}