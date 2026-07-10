import { Injectable } from "@angular/core";
import { CraftSubmission, entryType, MaterialSubmission, RecordEntry } from "./records.model";

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
   

    private createMaterialRecord(material: MaterialSubmission, mode: string): RecordEntry {
        const entry = mode as entryType;

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
        const entry = mode as entryType;

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

    async recordMaterialSubmission(material: MaterialSubmission, mode: string): Promise<void> {
        if (mode !== 'deposit' && mode !== 'withdraw') {
            return;
        }

        const entry = this.createMaterialRecord(material, mode);
        
    }

    async recordCraftSubmission(craft: CraftSubmission, mode: string): Promise<void> {
        if (mode !== 'deposit' && mode !== 'withdraw') {
            return;
        }

        const entry = this.createCraftRecord(craft, mode);

    }
}