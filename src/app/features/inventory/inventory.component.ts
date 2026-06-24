import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DataStore } from "../../core/data/data.store";
import { MatSelectModule } from "@angular/material/select";
import { ItemData, Category } from "../../core/data/item.model";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DatePipe } from "@angular/common";
import { InventoryService, SearchableItem } from "./inventory.service";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-inventory',
    templateUrl: 'inventory.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatSelectModule,
    RouterLink, MatAutocompleteModule
]
})
export class InventoryComponent implements OnInit {

    data = inject(DataStore);
    service = inject(InventoryService);
    mode = signal<string>('');
    route = inject(ActivatedRoute);
    fb = inject(FormBuilder);
    snackBar = inject(MatSnackBar);
    title = computed(() => this.mode().charAt(0).toUpperCase() + this.mode().slice(1));

    form = this.fb.group({
        purpose: this.fb.control<string | null>(null),
        silver: this.fb.control<number | null>(null),
        ownership: this.fb.control<string | null>(null),
        usage: this.fb.control<string | null>(null),
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

        if (this.mode() === 'deposit') {
            this.form.get('purpose')?.setValidators([Validators.required]);
            this.form.get('silver')?.setValue(null);
            this.form.get('usage')?.clearValidators();
            this.form.get('ownership')?.clearValidators();
            this.form.get('usage')?.setValue(null);
            this.form.get('ownership')?.setValue(null);
        } else {
            this.form.get('usage')?.setValidators([Validators.required]);
            this.form.get('ownership')?.setValidators([Validators.required]);
            this.form.get('purpose')?.clearValidators();
            this.form.get('silver')?.setValue(null);
            this.form.get('purpose')?.setValue(null);
        }

        this.form.get('silver')?.updateValueAndValidity();
        this.form.get('purpose')?.updateValueAndValidity();
        this.form.get('usage')?.updateValueAndValidity();
        this.form.get('ownership')?.updateValueAndValidity();
        this.addNewItem();
    }

    displayItem(item: SearchableItem | null): string {
        return item?.item.name ?? '';
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
        return this.form.get('items') as FormArray;
    }

    addNewItem(category: Category | null = null, item: ItemData | null = null) {
        const group = this.fb.group({
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

    async submit() {
        const value = this.form.getRawValue() as {
            purpose: string | null;
            silver: number | null;
            ownership: string | null;
            usage: string | null;
            items: {
                category: Category | null;
                item: ItemData;
                quantity: number;
            }[];
        };

        const rows = value.items ?? [];

        const total = rows.reduce(
            (sum, row) => sum + (row.quantity * row.item.price),
            0
        );

        const label = this.mode().toLowerCase() === 'deposit'
            ? 'given'
            : 'taken';

        const date = new DatePipe('en-GB').transform(new Date(), 'dd-MM-yyyy');

        const items = rows
            .map(
                row =>
                    `* ${row.quantity}x ${row.item.name} (${row.quantity * row.item.price})`
            )
            .join('\n');

        let output = `## ${this.mode().toUpperCase()} 
*${date}*

**Items ${label}:**
${items}

**Total Silver in Materials:** 
${total}`;

        if (value.silver !== null && value.silver !== 0) {
            output += `
            
**Silver ${this.isDeposit() ? 'given' : 'taken'}:**
${value.silver}

**Total Silver:**
${total + (value.silver)}`;
        }

        if (this.isDeposit()) {
            output += `

**Purpose:**
${value.purpose ?? ''}`;
        } else {
            output += `


**Personal Use/Clan/Profit?**
${value.usage ?? ''}

**For You, the Clan, or Militia Member?**
${value.ownership ?? ''}`
        }

        await navigator.clipboard.writeText(output);
        this.snackBar.open('Copied to clipboard', 'OK', {duration: 2000});
    }
}