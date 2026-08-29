import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ItemData } from "../../core/data/item.model";
import { MaterialService, SearchableItem } from "./material.service";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-material',
    templateUrl: 'material.component.html',
    styles: `:host { @apply flex-1; }`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatSelectModule,
    MatAutocompleteModule
]
})
export class MaterialComponent implements OnInit {

    service = inject(MaterialService);
    mode = input.required<string>();
    fb = inject(FormBuilder);
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
        this.addNewItem(searchable.path, searchable.item);
        this.searchControl.setValue('');
    }

    isDeposit(): boolean {
        return this.mode() === 'deposit';
    }

    formatPath(path: string[] | null | undefined): string {
        return path?.join(' / ') ?? '';
    }

    get itemRows(): FormArray {
        return this.form().get('items') as FormArray;
    }

    addNewItem(path: string[], item: ItemData) {
        const group = this.fb.group({
            id: crypto.randomUUID(),
            path: [path, Validators.required],
            item: [item, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]]
        });

        this.itemRows.push(group);
    }

    removeItem(index: number) {
        this.itemRows.removeAt(index);
    }
}