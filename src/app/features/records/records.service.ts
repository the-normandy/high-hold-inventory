import { Injectable } from "@angular/core";
import { CraftSubmission, MaterialSubmission, RecordEntry } from "./records.model";

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
   
    createMaterialRecord(material: MaterialSubmission): RecordEntry {
        return {
            id: crypto.randomUUID(),
            entry: 'deposit',
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

    createCraftRecord(craft: CraftSubmission): RecordEntry {
        return {
            id: crypto.randomUUID(),
            entry: 'deposit',
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
}