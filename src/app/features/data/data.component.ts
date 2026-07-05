import { Component, inject, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule } from "@angular/material/tree";
import { TreeNode } from './data.model'
import { DataStore } from "../../core/data/data.store";

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatButtonModule, MatTreeModule, MatIconModule
    ]
})
export class DataComponent implements OnInit {

    ngOnInit(): void {
        this.treeData.set(this.data.getTree());
    }

    private readonly data = inject(DataStore);
    readonly childrenAccessor = (node: TreeNode) => node.children ?? [];
    hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;
    treeData = signal<TreeNode[]>([]);
}