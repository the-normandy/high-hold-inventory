import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ItemData } from "../../core/data/item.model";
import { MaterialService, SearchableItem } from "./material.service";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-material',
    templateUrl: 'material.component.html',
    styleUrl: 'report-section.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    ReactiveFormsModule, MatIconModule, MatButtonModule, MatAutocompleteModule
]
})
export class MaterialComponent {

    service = inject(MaterialService);
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

    displayItem(item: SearchableItem | null): string {
        return item?.item?.name ?? '';
    }

    onQuickAdd(searchable: SearchableItem) {
        this.addNewItem(searchable.path, searchable.item);
        this.searchControl.setValue('');
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