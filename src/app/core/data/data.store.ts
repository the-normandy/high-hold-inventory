import { Injectable } from "@angular/core";
import { ItemData } from "./item.model";
import { PricesFile } from "./data.service"
import { TreeNode } from "../../features/data/data.model";

@Injectable({
    providedIn: 'root'
})
export class DataStore {

    load(data: PricesFile): void {
        this.schema = data.schema;
        this.items = data.materials;
        this.craftData = data.craft;
        this.craftItems = Object.keys(data.craft) as string[];
    }

    craftItems: string[] = [];
    schema: number | null = null;
    items = {} as Record<string, ItemData[]>;
    craftData = {} as Record<string, Record<string, ItemData[]>>;

    getTree(): TreeNode[] {
        const materialRoot: TreeNode = {
            name: 'Materials',
            path: ['materials'],
            children: Object.keys(this.items).map(key => ({
                name: key,
                path: ['materials', key]
            }))
        };

        const craftRoot: TreeNode = {
            name: 'Craft',
            path: ['craft'],
            children: Object.entries(this.craftData).map(([craft, categories]) => ({
                name: craft,
                path: ['craft', craft],
                children: Object.keys(categories).map(category => ({
                    name: category,
                    path: ['craft', craft, category]
                }))
            }))
        };

        return [
            materialRoot,
            craftRoot
        ];
    }
}