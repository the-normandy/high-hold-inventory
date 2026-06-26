import { Component, computed, inject, input, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ActivatedRoute } from "@angular/router";
import { DataStore } from "../../core/data/data.store";
import { MatSelectModule } from "@angular/material/select";
import { ItemData, Category } from "../../core/data/item.model";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MaterialService, SearchableItem } from "./material.service";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-material',
    templateUrl: 'material.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatSelectModule,
    MatAutocompleteModule
]
})
export class MaterialComponent implements OnInit {

    data = inject(DataStore);
    service = inject(MaterialService);
    mode = input.required<string>();
    route = inject(ActivatedRoute);
    fb = inject(FormBuilder);
    snackBar = inject(MatSnackBar);
    title = computed(() => this.mode().charAt(0).toUpperCase() + this.mode().slice(1));

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

    ngOnInit() {
        if (this.mode() === 'deposit') {
            this.form().get('purpose')?.setValidators([Validators.required]);
            this.form().get('silver')?.setValue(null);
            this.form().get('usage')?.clearValidators();
            this.form().get('ownership')?.clearValidators();
            this.form().get('usage')?.setValue(null);
            this.form().get('ownership')?.setValue(null);
        } else {
            this.form().get('usage')?.setValidators([Validators.required]);
            this.form().get('ownership')?.setValidators([Validators.required]);
            this.form().get('purpose')?.clearValidators();
            this.form().get('silver')?.setValue(null);
            this.form().get('purpose')?.setValue(null);
        }

        this.form().get('silver')?.updateValueAndValidity();
        this.form().get('purpose')?.updateValueAndValidity();
        this.form().get('usage')?.updateValueAndValidity();
        this.form().get('ownership')?.updateValueAndValidity();
    }

    displayItem(item: SearchableItem | null): string {
        return item?.item?.name ?? '';
    }

    onQuickAdd(searchable: SearchableItem) {
        this.addNewItem(searchable.category, searchable.item);
        this.searchControl.setValue('');
        (document.getElementById('search') as HTMLInputElement).value = '';
    }

    isDeposit(): boolean {
        return this.mode() === 'deposit';
    }

    get categories(): Category[] {
        return Object.keys(this.data.items) as Category[];
    }

    getItemsFromRow(index: number): ItemData[] {
        const row = this.itemRows.at(index);

        const category = row.get('category')?.value as Category | null;

        return category
            ? this.data.items[category]
            : [];
    }

    get itemRows(): FormArray {
        return this.form().get('items') as FormArray;
    }

    addNewItem(category: Category | null = null, item: ItemData | null = null) {
        const group = this.fb.group({
            id: crypto.randomUUID(),
            category: [category, Validators.required],
            item: [item, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]]
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