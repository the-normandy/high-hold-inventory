import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { ItemData } from "../../core/data/item.model";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CraftService, CraftSearchableItem } from "./craft.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

@Component({
    selector: 'app-craft',
    templateUrl: 'craft.component.html',
    styles: `:host { @apply flex-1; }`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    ReactiveFormsModule, MatIconModule, MatButtonModule, MatCheckboxModule,
    MatAutocompleteModule
]
})
export class CraftComponent {
    service = inject(CraftService);
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
            quantity: [1, [Validators.required, Validators.min(1)]],
            laborOnly: [false]
        });

        this.itemRows.push(group);
    }

    removeItem(index: number) {
        this.itemRows.removeAt(index);
    }
}