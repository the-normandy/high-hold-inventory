import { Injectable, signal } from "@angular/core";
import { ItemData, ItemTree } from "./item.model";
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
    schema: number = 1;
    items: ItemTree = {};
    craftData: ItemTree = {};
    webhook = signal<string | null>(null);

    private isLeaf(node: ItemTree | ItemData[]): node is ItemData[] {
        return Array.isArray(node);
    }

    private traversePath(path: string[], node: ItemTree | ItemData[]): ItemTree | ItemData[] | undefined {
        let current: ItemTree | ItemData[] | undefined = node;

        for (const segment of path) {
            if (!current || this.isLeaf(current)) {
                return undefined;
            }
            current = current[segment];
        }

        return current;
    }

    private rootForPath(path: string[]): ItemTree | undefined {
        const rootKey = path[0];
        if (rootKey === 'materials') return this.items;
        if (rootKey === 'craft') return this.craftData;
        return undefined;
    }

    getLeaf(path: string[]): ItemData[] | undefined {
        const root = this.rootForPath(path);
        if (!root) {
            return undefined;
        }

        const node = this.traversePath(path.slice(1), root);
        if (!node) {
            return undefined;
        }

        return this.isLeaf(node) ? node : undefined;
    }

    getChildKeys(path: string[]): string[] {
        const root = this.rootForPath(path);
        if (!root) {
            return [];
        }

        const node = this.traversePath(path.slice(1), root);
        if (!node || this.isLeaf(node)) {
            return [];
        }

        return Object.keys(node);
    }

    private buildTree(node: ItemTree | ItemData[], path: string[]): TreeNode[] | undefined {
        if (this.isLeaf(node)) {
            return undefined;
        }

        return Object.entries(node).map(([name, child]) => ({
            name,
            path: [...path, name],
            children: this.isLeaf(child) ? undefined : this.buildTree(child, [...path, name])
        }));
    }

    getTree(): TreeNode[] {
        const materialRoot: TreeNode = {
            name: 'Materials',
            path: ['materials'],
            children: this.buildTree(this.items, ['materials'])
        };

        const craftRoot: TreeNode = {
            name: 'Craft',
            path: ['craft'],
            children: this.buildTree(this.craftData, ['craft'])
        };

        return [
            materialRoot,
            craftRoot
        ];
    }
}