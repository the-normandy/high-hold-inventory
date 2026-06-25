import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { DataStore } from "../../core/data/data.store";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { AlchemyCategory, BlacksmithingCategory, CraftCategory, ItemData, LeatherworkingCategory, WoodcarvingCategory } from "../../core/data/item.model";
import { DatePipe } from "@angular/common";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CraftService, CraftSearchableItem } from "./craft.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

@Component({
    selector: 'app-craft',
    templateUrl: 'craft.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
    MatFormFieldModule, ReactiveFormsModule, MatIconModule, MatInputModule,
    MatButtonModule, MatSelectModule, RouterModule, MatCheckboxModule, MatAutocompleteModule
]
})
export class CraftComponent implements OnInit {
    data = inject(DataStore);
    service = inject(CraftService);
    fb = inject(FormBuilder);
    snackBar = inject(MatSnackBar);
    route = inject(ActivatedRoute);
    mode = signal<string>('');

    form = this.fb.group({
        purpose: this.fb.control<string | null>(null),
        items: this.fb.array<FormGroup<any>>([])
    });

    allItems = this.service.getAllItems();

    searchControl = new FormControl('');

    searchText = toSignal(
        this.searchControl.valueChanges,
        { initialValue: '' }
    );

    filteredItems = computed(() => {
        const search = this.searchText()?.toLowerCase() ?? '';

        return this.allItems.filter(item =>
            item.item.name.toLowerCase().includes(search)
        );
    });

    ngOnInit() {
        const param = this.route.snapshot.paramMap.get('mode');

        if (!param) {
            throw new Error('Route parameter not found');
        }

        this.mode.set(param.toLowerCase());

        this.addNewItem();
    }

    displayItem(item: CraftSearchableItem | null): string {
        return item?.item.name ?? '';
    }

    onQuickAdd(searchable: CraftSearchableItem) {
        this.addNewItem(
            searchable.craft,
            searchable.category,
            searchable.item
        );

        this.searchControl.setValue('');
        (document.getElementById('search') as HTMLInputElement).value = '';
    }

    get crafting(): CraftCategory[] {
        return this.data.craftItems;
    }

    getCategories(crafting: CraftCategory | undefined): string[] {
        if (!crafting) {
            return [];
        }
        switch(crafting) {
            case 'Alchemy':
                return Object.keys(this.data.alchemyItems);
            case 'Blacksmithing':
                return Object.keys(this.data.blacksmithingItems);
            case 'Leatherworking':
                return Object.keys(this.data.leatherworkingItems);
            case 'Woodcarving':
                return Object.keys(this.data.woodcarvingItems);
        }
    }

    get itemRows(): FormArray {
        return this.form.get('items') as FormArray;
    }

    getCategoriesFromRow(index: number): string[] {
        const row = this.itemRows.at(index);

        const crafting = row.get('crafting')?.value as CraftCategory | undefined;

        return this.getCategories(crafting);
    }

    getItemsFromRow(index: number): ItemData[] {
        const row = this.itemRows.at(index);

        const crafting = row.get('crafting')?.value as CraftCategory | null;
        const category = row.get('category')?.value as string | null;

        if (!crafting || !category) {
            return [];
        }

        switch (crafting) {
            case 'Alchemy':
                return this.data.alchemyItems[category as AlchemyCategory];

            case 'Blacksmithing':
                return this.data.blacksmithingItems[category as BlacksmithingCategory];

            case 'Leatherworking':
                return this.data.leatherworkingItems[category as LeatherworkingCategory];

            case 'Woodcarving':
                return this.data.woodcarvingItems[category as WoodcarvingCategory];
        }
    }

    addNewItem(crafting: CraftCategory | null = null, category: string | null = null, item: ItemData | null = null) {
        const group = this.fb.group({
            id: crypto.randomUUID(),
            crafting: [crafting, Validators.required],
            category: [category, Validators.required],
            item: [item, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            laborOnly: [false]
        });

        group.get('crafting')?.valueChanges.subscribe(() => {
            group.get('category')?.setValue(null);
            group.get('item')?.setValue(null);
        });

        group.get('category')?.valueChanges.subscribe(() => {
            group.get('item')?.setValue(null);
        })

        this.itemRows.push(group);
    }

    removeItem(index: number) {
        this.itemRows.removeAt(index);
    }

    async submit() {
        const value = this.form.getRawValue() as {
            purpose: string | null;
            items: {
                category: CraftCategory | null;
                item: ItemData;
                quantity: number;
                laborOnly: boolean;
            }[]
        }

        const rows = value.items ?? [];

        const total = rows.reduce(
            (sum, row) => 
                sum + (row.quantity * (row.laborOnly ? row.item.labor! : row.item.price)
        ), 0);

        const date = new DatePipe('en-GB').transform(new Date(), 'dd-MM-yyyy');

        const items = rows
            .map(
                row =>
                    `* ${row.quantity}x ${row.item.name} (${row.quantity * ( row.laborOnly ? row.item.labor! : row.item.price)})`
            )
            .join('\n');

        let output = `## ${this.mode().toUpperCase()}
*${date}*

**Items ${this.mode() === 'withdraw' ? 'withdrawn' : 'deposited'}:**
${items}

**Total Silver:** 
${total}

**Purpose:**
${value.purpose ?? ''}`;

        await navigator.clipboard.writeText(output);
        this.snackBar.open('Copied to clipboard', 'OK', {duration: 2000});        
    }

}