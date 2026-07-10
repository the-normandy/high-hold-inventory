import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule } from "@angular/material/tree";
import { TreeNode } from './data.model'
import { DataStore } from "../../core/data/data.store";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { ItemData } from "../../core/data/item.model";
import { DataService, PricesFile } from "../../core/data/data.service";
import { MatInputModule } from "@angular/material/input";
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { HttpClient } from "@angular/common/http";
import { BaseDirectory, readFile } from "@tauri-apps/plugin-fs";
import { firstValueFrom } from "rxjs";
import { MaterialService } from "../inventory/material.service";
import { CraftService } from "../inventory/craft.service";

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    styleUrl: 'data.component.css',
    imports: [
        MatButtonModule, MatTreeModule, MatIconModule, MatDividerModule,
        RouterLink, MatInputModule, ReactiveFormsModule, MatFormFieldModule,
        MatTooltipModule, MatSnackBarModule
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
        if (!this.data.webhook()) {
            this.snackBar.open("Failed to detect webhook data. It's highly recommended you set it up in Settings.", 'Dismiss', {duration: 5000});
        }
    }

    protected readonly data = inject(DataStore);
    private readonly dataService = inject(DataService);
    private readonly materialService = inject(MaterialService);
    private readonly craftService = inject(CraftService);
    http = inject(HttpClient);
    private readonly formEffect = effect(() => {
        this.rebuildForm(this.fieldSnapshot());
    });
    readonly childrenAccessor = (node: TreeNode) => node.children ?? [];
    snackBar = inject(MatSnackBar);
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
        this.form.setControl(
            'items',
            this.fb.array(items.map(item => this.createItemGroup(item, this.isCraft())))
        );
    }

    private clearForm() {
        this.form = this.fb.group({
            items: this.fb.array<FormGroup>([])
        });
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

        const items = [...(this.items.getRawValue() as ItemData[])]
            .sort((a, b) =>
                a.name.localeCompare(b.name, undefined, {
                    sensitivity: 'base'
                })
            );

        current[path.at(-1)!] = items;
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

    discard() {
        this.refreshSnapshot();
        this.rebuildForm(this.fieldSnapshot());
    }

    private refreshSnapshot(): void {
        this.dataSnapshot.set({
            schema: structuredClone(this.data.schema),
            craft: structuredClone(this.data.craftData),
            materials: structuredClone(this.data.items),
        });
    }
    private async persistSnapshot(): Promise<void> {
        await this.dataService.save(this.dataSnapshot()!);
        await this.dataService.load();

        this.refreshSnapshot();
    }

    private refreshForm(): void {
        const selection = [...this.selected()];

        this.selected.set([]);
        this.rebuildForm(this.fieldSnapshot());
        this.selected.set(selection);
    }

    async saveButton() {
        try {
            await this.save();
            this.snackBar.open('Prices saved successfully.', 'OK', {duration: 2000});
        } catch(e) {
            this.snackBar.open('Failed to save prices.', 'OK', {duration: 2000});
        }
    }

    async saveAndExportButton(): Promise<void> {
        try {
            await this.save();
            await this.export();
            this.snackBar.open('Data saved and exported successfully.', 'OK', {duration: 2000});
        } catch (e) {
            const err = e as Error;
            this.snackBar.open(err.message, 'OK', {duration: 3000});
        }
    }

    async save(): Promise<void> {
        const snapshot = this.dataSnapshot()!;

        if (Object.keys(snapshot.materials).length === 0 || Object.keys(snapshot.craft).length === 0) {
            throw new Error("Refusing to save an empty dataset.")
        }

        try {
            if (this.selected().length > 0) {
                this.saveCurrentForm();
                this.clearForm();
            }
            await this.persistSnapshot();
            this.materialService.clearAndRebuild();
            this.craftService.clearAndRebuild();
            this.refreshForm();
        } catch (e) {
            throw new Error("Failed to save prices.");
        }
    }

    async export() {
        const webhook = this.data.webhook();
        if (!webhook) {
            throw new Error("Webhook not detected in settings.");
        }
        try {
            const bytes = await readFile('prices.json', { baseDir: BaseDirectory.AppLocalData });
            const blob = new Blob([bytes], {type: 'application/json'});
            const form = new FormData();
            form.append('files[0]', blob, 'prices.json');
            await firstValueFrom(this.http.post(webhook, form));
        } catch(e) {
            throw new Error("Failed to upload to webhook.");
        }
    }
}