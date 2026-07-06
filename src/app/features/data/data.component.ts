import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule } from "@angular/material/tree";
import { TreeNode } from './data.model'
import { DataStore } from "../../core/data/data.store";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { ItemData } from "../../core/data/item.model";
import { PricesFile } from "../../core/data/data.service";

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    styleUrl: 'data.component.css',
    imports: [
        MatButtonModule, MatTreeModule, MatIconModule, MatDividerModule,
        RouterLink
    ]
})
export class DataComponent implements OnInit {

    ngOnInit(): void {
        this.dataSnapshot.set({
            schema: structuredClone(this.data.schema),
            craft: structuredClone(this.data.craftData),
            materials: structuredClone(this.data.items),
        });
        this.treeData.set(this.data.getTree());
    }

    private readonly data = inject(DataStore);
    readonly childrenAccessor = (node: TreeNode) => node.children ?? [];
    hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;
    dataSnapshot = signal<PricesFile | null>(null);
    treeData = signal<TreeNode[]>([]);
    selected = signal<string[]>([]);

    fieldSnapshot = computed(() => {
    const data = this.dataSnapshot();
    const path = this.selected();

    if (!data || path.length === 0) {
        return [];
    }

    let current: any = data;

    for (const key of path) {
        current = current[key];

        if (current == null) {
            return [];
        }
    }

    return current as ItemData[];
});

    isSelected(node: TreeNode): boolean {
        return node.path == this.selected();
    }

    select(node: TreeNode) {
        this.selected.set(node.path);
    }
}