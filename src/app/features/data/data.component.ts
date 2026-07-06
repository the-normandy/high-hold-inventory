import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule } from "@angular/material/tree";
import { TreeNode } from './data.model'
import { DataStore } from "../../core/data/data.store";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { ItemData } from "../../core/data/item.model";
import { PricesFile } from "../../core/data/data.service";
import { MatInputModule } from "@angular/material/input";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    styleUrl: 'data.component.css',
    imports: [
        MatButtonModule, MatTreeModule, MatIconModule, MatDividerModule,
        RouterLink, MatInputModule, ReactiveFormsModule, MatFormFieldModule,
        MatTooltipModule
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
    private readonly formEffect = effect(() => {
        this.rebuildForm(this.fieldSnapshot());
    });
    readonly childrenAccessor = (node: TreeNode) => node.children ?? [];
    hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;
    dataSnapshot = signal<PricesFile | null>(null);
    treeData = signal<TreeNode[]>([]);
    selected = signal<string[]>([]);
    fb = inject(FormBuilder);
    form = this.fb.group({
        items: this.fb.array<FormGroup>([])
    });

    isCraft = computed(() => this.selected()[0] === 'craft');

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

    get items(): FormArray {
        return this.form.get('items') as FormArray;
    }

    private createItemGroup(item: ItemData, isCraft: boolean = false): FormGroup {
        const group = new FormGroup({});

        group.addControl('name', this.fb.control(item.name));
        group.addControl('price', this.fb.control(item.price));

        if (item.labor !== undefined || isCraft) {
            group.addControl(
                'labor',
                this.fb.control(item.labor)
            );
        }

        return group;
    }

    private rebuildForm(items: ItemData[]) {
        this.items.clear();
        
        for (const item of items) {
            this.items.push(this.createItemGroup(item));
        }
    }

    private saveCurrentForm(): void {
        const data = this.dataSnapshot();

        if (!data || this.selected().length === 0) {
            return;
        }

        let current: any = data;
        const path = this.selected();

        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }

        current[path.at(-1)!] = this.items.getRawValue() as ItemData[];
    }

    addItem() {
        this.items.push(
            this.createItemGroup(
                {
                    name: '',
                    price: 0
                },
                this.isCraft()
            )
        );
    }

    removeItem(index: number) {
        this.items.removeAt(index);
    }

    isSelected(node: TreeNode): boolean {
        return node.path == this.selected();
    }

    select(node: TreeNode) {
        if (this.selected().length > 0) this.saveCurrentForm();
        this.selected.set(node.path);
    }
}