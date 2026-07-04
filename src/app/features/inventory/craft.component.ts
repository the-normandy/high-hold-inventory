import { Component, computed, inject, input } from "@angular/core";
import { DataStore } from "../../core/data/data.store";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { ItemData } from "../../core/data/item.model";
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
export class CraftComponent {
    data = inject(DataStore);
    service = inject(CraftService);
    snackBar = inject(MatSnackBar);
    route = inject(ActivatedRoute);
    mode = input.required<string>();
    fb = inject(FormBuilder);
    form = input.required<FormGroup>();

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

    get crafting(): string[] {
        return this.data.craftItems;
    }

    getCategories(crafting: string | undefined): string[] {
        if (!crafting) {
            return [];
        }
        return Object.keys(this.data.craftData[crafting] ?? {});
    }

    get itemRows(): FormArray {
        return this.form().get('items') as FormArray;
    }

    getCategoriesFromRow(index: number): string[] {
        const row = this.itemRows.at(index);

        const crafting = row.get('crafting')?.value as string | undefined;

        return this.getCategories(crafting);
    }

    getItemsFromRow(index: number): ItemData[] {
        const row = this.itemRows.at(index);

        const crafting = row.get('crafting')?.value as string | null;
        const category = row.get('category')?.value as string | null;

        if (!crafting || !category) {
            return [];
        }

        return this.data.craftData[crafting]?.[category] ?? [];
    }

    addNewItem(crafting: string | null = null, category: string | null = null, item: ItemData | null = null) {
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
}