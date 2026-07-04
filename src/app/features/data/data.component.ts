import { Component, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule } from "@angular/material/tree";
import { TreeNode } from './data.model'

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatButtonModule, MatTreeModule, MatIconModule
    ]
})
export class DataComponent {

    treeNodes = signal<TreeNode[]>([]);
}