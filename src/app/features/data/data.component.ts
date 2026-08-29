import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule, MatTreeNestedDataSource } from "@angular/material/tree";
import { NestedTreeControl } from "@angular/cdk/tree";
import { TreeNode } from './data.model'
import { DataStore } from "../../core/data/data.store";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { ItemData, ItemTree } from "../../core/data/item.model";
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
import { CategoryDialogComponent } from "./category-dialog.component";
import { CategoryDeleteDialogComponent } from "./category-delete-dialog.component";

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    styleUrl: 'data.component.css',
    imports: [
        MatButtonModule, MatTreeModule, MatIconModule, MatDividerModule,
        RouterLink, MatInputModule, ReactiveFormsModule, MatFormFieldModule,
        MatTooltipModule, MatSnackBarModule, MatDialogModule
    ]
})
export class DataComponent implements OnInit {

    ngOnInit(): void {
        this.refreshSnapshot();
        if (!this.data.webhook()) {
            this.snackBar.open("Failed to detect webhook data. It's highly recommended you set it up in Settings.", 'Dismiss', {duration: 5000});
        }
    }

    protected readonly data = inject(DataStore);
    private readonly dataService = inject(DataService);
    private readonly materialService = inject(MaterialService);
    private readonly craftService = inject(CraftService);
    private readonly dialog = inject(MatDialog);
    http = inject(HttpClient);
    private readonly formEffect = effect(() => {
        this.rebuildForm(this.fieldSnapshot());
    });
    treeControl = new NestedTreeControl<TreeNode>(node => node.children ?? []);
    dataSource = new MatTreeNestedDataSource<TreeNode>();
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

    return Array.isArray(current) ? current as ItemData[] : [];
    });

    get items(): FormArray {
        return this.form.get('items') as FormArray;
    }

    private buildTreeFromSnapshot(snapshot: PricesFile): TreeNode[] {
        const buildTree = (node: ItemTree | ItemData[], path: string[]): TreeNode[] | undefined => {
            if (Array.isArray(node)) {
                return undefined;
            }

            return Object.entries(node).map(([name, child]) => ({
                name,
                path: [...path, name],
                isLeafNode: Array.isArray(child),
                hasLeafChildren: !Array.isArray(child) && Object.values(child).some(value => Array.isArray(value)),
                children: Array.isArray(child) ? undefined : buildTree(child, [...path, name])
            }));
        };

        return Object.entries(snapshot)
            .filter(([key]) => key !== 'schema')
            .map(([key, rootNode]) => {
                const rootTree = rootNode as ItemTree;
                return {
                    name: key === 'materials' ? 'Materials' : key === 'craft' ? 'Craft' : key,
                    path: [key],
                    isLeafNode: false,
                    hasLeafChildren: Object.values(rootTree).some(value => Array.isArray(value)),
                    children: buildTree(rootTree, [key])
                };
            });
    }

    private captureExpandedNodePaths(): string[][] {
        return (this.treeControl.expansionModel.selected as TreeNode[] | undefined ?? [])
            .map(node => node.path);
    }

    private restoreExpandedNodes(expandedPaths: string[][]): void {
        const sortedPaths = expandedPaths.slice().sort((a, b) => a.length - b.length);
        for (const path of sortedPaths) {
            const node = this.getTreeNodeByPath(path, this.treeData());
            if (node) {
                this.treeControl.expand(node);
            }
        }
    }

    private setSnapshot(snapshot: PricesFile): void {
        const expandedPaths = this.captureExpandedNodePaths();
        this.dataSnapshot.set(snapshot);
        const tree = this.buildTreeFromSnapshot(snapshot);
        this.treeData.set(tree);
        this.dataSource.data = tree;
        this.treeControl.dataNodes = tree;
        Promise.resolve().then(() => this.restoreExpandedNodes(expandedPaths));
    }

    // Returns the node located at the given tree path inside the snapshot.
    private getNodeAtPath(path: string[], data: PricesFile): ItemTree | ItemData[] | undefined {
        if (path.length === 0) {
            return undefined;
        }

        let current: ItemTree | ItemData[] | undefined = data[path[0]] as ItemTree | ItemData[] | undefined;
        if (!current || path[0] === 'schema') {
            return undefined;
        }

        for (const key of path.slice(1)) {
            if (!current || Array.isArray(current)) {
                return undefined;
            }
            current = current[key];
        }

        return current;
    }

    // Replaces an existing node or leaf at the given path with a new value.
    private setNodeAtPath(path: string[], data: PricesFile, value: ItemTree | ItemData[]): void {
        if (path.length === 0) {
            return;
        }

        let current: ItemTree | ItemData[] | undefined = data[path[0]] as ItemTree | ItemData[] | undefined;
        if (!current || path[0] === 'schema') {
            return;
        }

        for (let i = 1; i < path.length - 1; i++) {
            const key = path[i];
            if (!current || Array.isArray(current)) {
                return;
            }
            current = current[key] as ItemTree;
        }

        if (!current || Array.isArray(current)) {
            return;
        }

        current[path.at(-1)!] = value;
    }

    // Removes the node or subtree located at the specified path.
    private removeNodeAtPath(path: string[], data: PricesFile): void {
        if (path.length === 0) {
            return;
        }

        let current: ItemTree | ItemData[] | undefined = data[path[0]] as ItemTree | ItemData[] | undefined;
        if (!current || path[0] === 'schema') {
            return;
        }

        for (let i = 1; i < path.length - 1; i++) {
            const key = path[i];
            if (!current || Array.isArray(current)) {
                return;
            }
            current = current[key] as ItemTree;
        }

        if (!current || Array.isArray(current)) {
            return;
        }

        delete current[path.at(-1)!];
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

        const path = this.selected();
        const parent = this.getNodeAtPath(path.slice(0, -1), data);

        if (!parent || Array.isArray(parent)) {
            return;
        }

        const current = parent[path.at(-1)!];
        if (!Array.isArray(current)) {
            return;
        }

        const items = [...(this.items.getRawValue() as ItemData[])]
            .sort((a, b) =>
                a.name.localeCompare(b.name, undefined, {
                    sensitivity: 'base'
                })
            );

        parent[path.at(-1)!] = items;
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

    addCategoryToNode(node: TreeNode) {
        return this.addCategoryToPath(node.path);
    }

    renameCategoryNode(node: TreeNode) {
        return this.renameCategoryAtPath(node.path);
    }

    removeCategoryNode(node: TreeNode) {
        return this.removeCategoryAtPath(node.path);
    }

    private async runCategoryDialog(): Promise<string | null> {
        const dialogRef = this.dialog.open(CategoryDialogComponent, {
            width: '400px'
        });

        return await firstValueFrom(dialogRef.afterClosed()) as string | null;
    }

    private canAddCategoryOnSnapshot(path: string[], snapshot: PricesFile): boolean {
        const parent = this.getNodeAtPath(path, snapshot);
        return !!parent && !Array.isArray(parent);
    }

    private async addCategoryToPath(path: string[]): Promise<void> {
        const name = await this.runCategoryDialog();
        if (!name) {
            return;
        }

        const snapshot = structuredClone(this.dataSnapshot());
        if (!snapshot) {
            return;
        }

        if (!this.canAddCategoryOnSnapshot(path, snapshot)) {
            return;
        }

        const parent = this.getNodeAtPath(path, snapshot);
        if (!parent || Array.isArray(parent)) {
            return;
        }

        parent[name] = {};
        this.setSnapshot(snapshot);
    }

    private async renameCategoryAtPath(path: string[]): Promise<void> {
        const newName = await this.runCategoryDialog();
        if (!newName) {
            return;
        }

        const snapshot = structuredClone(this.dataSnapshot());
        if (!snapshot) {
            return;
        }

        const lastKey = path.at(-1);
        const parentPath = path.slice(0, -1);
        const parent = this.getNodeAtPath(parentPath, snapshot);

        if (!parent || Array.isArray(parent) || !lastKey) {
            return;
        }

        const node = parent[lastKey];
        if (node === undefined) {
            return;
        }

        delete parent[lastKey];
        parent[newName] = node;
        this.selected.set([...parentPath, newName]);
        this.setSnapshot(snapshot);
    }

    private async removeCategoryAtPath(path: string[]): Promise<void> {
        const dialogRef = this.dialog.open(CategoryDeleteDialogComponent, {
            width: '400px'
        });

        const confirmed = await firstValueFrom(dialogRef.afterClosed()) as boolean | null;
        if (!confirmed) {
            return;
        }

        const snapshot = structuredClone(this.dataSnapshot());
        if (!snapshot) {
            return;
        }

        const lastKey = path.at(-1);
        const parentPath = path.slice(0, -1);
        const parent = this.getNodeAtPath(parentPath, snapshot);

        if (!parent || Array.isArray(parent) || !lastKey) {
            return;
        }

        delete parent[lastKey];
        this.selected.set(parentPath);
        this.setSnapshot(snapshot);
        this.snackBar.open('Category deleted.', 'OK', { duration: 2000 });
    }

    private getTreeNodeByPath(path: string[], nodes: TreeNode[] = this.treeData()): TreeNode | undefined {
        if (path.length === 0) {
            return undefined;
        }

        for (const node of nodes) {
            if (node.path.length === path.length && node.path.every((segment, index) => segment === path[index])) {
                return node;
            }

            if (node.children) {
                const childResult = this.getTreeNodeByPath(path, node.children);
                if (childResult) {
                    return childResult;
                }
            }
        }

        return undefined;
    }

    canAddCategoryAtPath(path: string[]): boolean {
        const node = this.getTreeNodeByPath(path);
        return !!node && !node.isLeafNode;
    }

    canEditSelectedItems(): boolean {
        return this.getTreeNodeByPath(this.selected())?.isLeafNode === true;
    }

    async addCategory() {
        if (!this.canAddCategoryAtPath(this.selected())) {
            return;
        }

        await this.addCategoryToPath(this.selected());
    }

    // Renames the currently selected category or subtree key.
    async renameCategory() {
        await this.renameCategoryAtPath(this.selected());
    }

    // Removes the currently selected category or subtree.
    async removeCategory() {
        await this.removeCategoryAtPath(this.selected());
    }

    isSelected(node: TreeNode): boolean {
        const selectedPath = this.selected();
        return node.path.length === selectedPath.length
            && node.path.every((segment, index) => segment === selectedPath[index]);
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
        this.setSnapshot({
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