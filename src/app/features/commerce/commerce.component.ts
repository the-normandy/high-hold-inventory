import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemData } from '../../core/data/item.model';
import { CraftSearchableItem, CraftService } from '../inventory/craft.service';
import { MaterialService, SearchableItem } from '../inventory/material.service';
import { CommerceFormItem, CommerceSource, CommerceSubmission, CommerceType } from './commerce.model';
import { CommerceService } from './commerce.service';

@Component({
    selector: 'app-commerce',
    templateUrl: 'commerce.component.html',
    styleUrl: 'commerce.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        RouterLink,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule
    ]
})
export class CommerceComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly formBuilder = inject(FormBuilder);
    private readonly materialService = inject(MaterialService);
    private readonly craftService = inject(CraftService);
    private readonly commerceService = inject(CommerceService);
    private readonly snackBar = inject(MatSnackBar);

    readonly type = signal<CommerceType>('sale');
    readonly includeMaterials = signal(true);
    readonly includeCraft = signal(true);
    readonly materialSearch = new FormControl('', { nonNullable: true });
    readonly craftSearch = new FormControl('', { nonNullable: true });
    readonly materialSearchText = toSignal(this.materialSearch.valueChanges, { initialValue: '' });
    readonly craftSearchText = toSignal(this.craftSearch.valueChanges, { initialValue: '' });
    readonly allMaterials = this.materialService.getAllItems();
    readonly allCraft = this.craftService.getAllItems();

    readonly filteredMaterials = computed(() => this.filterItems(this.allMaterials, this.materialSearchText()));
    readonly filteredCraft = computed(() => this.filterItems(this.allCraft, this.craftSearchText()));
    readonly title = computed(() => this.type() === 'sale' ? 'New sale' : 'New purchase');
    readonly actionLabel = computed(() => this.type() === 'sale' ? 'Record sale' : 'Record purchase');

    readonly form = this.formBuilder.group({
        customer: this.formBuilder.control('', { nonNullable: true, validators: [Validators.required] }),
        comment: this.formBuilder.control<string | null>(null),
        materials: this.formBuilder.array<FormGroup>([]),
        craft: this.formBuilder.array<FormGroup>([])
    });

    ngOnInit(): void {
        const type = this.route.snapshot.paramMap.get('type');
        if (type !== 'purchase' && type !== 'sale') {
            throw new Error('Invalid commerce transaction type.');
        }
        this.type.set(type);
    }

    get materialRows(): FormArray<FormGroup> {
        return this.form.controls.materials;
    }

    get craftRows(): FormArray<FormGroup> {
        return this.form.controls.craft;
    }

    displayItem(searchable: SearchableItem | CraftSearchableItem | null): string {
        return searchable?.item.name ?? '';
    }

    formatPath(path: string[]): string {
        return path.join(' / ');
    }

    addMaterial(searchable: SearchableItem): void {
        this.materialRows.push(this.createItemGroup('material', searchable.path, searchable.item));
        this.materialSearch.setValue('');
    }

    addCraft(searchable: CraftSearchableItem): void {
        this.craftRows.push(this.createItemGroup('craft', searchable.path, searchable.item));
        this.craftSearch.setValue('');
    }

    removeItem(source: CommerceSource, index: number): void {
        (source === 'material' ? this.materialRows : this.craftRows).removeAt(index);
    }

    toggleMaterials(included: boolean): void {
        this.includeMaterials.set(included);
        included ? this.materialRows.enable() : this.materialRows.disable();
    }

    toggleCraft(included: boolean): void {
        this.includeCraft.set(included);
        included ? this.craftRows.enable() : this.craftRows.disable();
    }

    async submit(): Promise<void> {
        const submission = this.getSubmission();
        if (!submission.customer || submission.items.length === 0 || this.form.invalid) {
            this.form.markAllAsTouched();
            this.snackBar.open('Add a customer and at least one valid item.', 'OK', { duration: 2500 });
            return;
        }

        try {
            await this.commerceService.record(submission, this.type());
            await navigator.clipboard.writeText(this.buildClipboardReport(submission));
            this.snackBar.open(`${this.title()} recorded and copied to clipboard.`, 'OK', { duration: 2500 });
        } catch {
            this.snackBar.open(`Failed to record ${this.type()}.`, 'OK', { duration: 2500 });
        }
    }

    private filterItems<T extends SearchableItem | CraftSearchableItem>(items: T[], search: string): T[] {
        const normalized = search.trim().toLowerCase();
        return items.filter(searchable =>
            searchable.item.name.toLowerCase().includes(normalized)
            || searchable.path.some(segment => segment.toLowerCase().includes(normalized))
        );
    }

    private createItemGroup(source: CommerceSource, path: string[], item: ItemData): FormGroup {
        return this.formBuilder.group({
            id: this.formBuilder.control(crypto.randomUUID(), { nonNullable: true }),
            source: this.formBuilder.control(source, { nonNullable: true }),
            path: this.formBuilder.control(path, { nonNullable: true }),
            item: this.formBuilder.control(item, { nonNullable: true }),
            quantity: this.formBuilder.control(1, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1)]
            }),
            unitPrice: this.formBuilder.control<number | null>(null, {
                validators: [Validators.required, Validators.min(0)]
            })
        });
    }

    private getSubmission(): CommerceSubmission {
        const rows = [
            ...(this.includeMaterials() ? this.materialRows.getRawValue() : []),
            ...(this.includeCraft() ? this.craftRows.getRawValue() : [])
        ] as CommerceFormItem[];

        return {
            customer: this.form.controls.customer.value.trim(),
            comment: this.form.controls.comment.value,
            items: rows
        };
    }

    private buildClipboardReport(submission: CommerceSubmission): string {
        const pastTense = this.type() === 'sale' ? 'sold' : 'purchased';
        const lines = submission.items.map(item => {
            const root = item.source === 'material' ? 'Materials' : 'Craft';
            const total = item.quantity * item.unitPrice;
            return `* ${item.quantity}x ${item.item.name} [${root} / ${this.formatPath(item.path)}] @ ${item.unitPrice} each (${total})`;
        });
        const total = submission.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const sections = [
            `## ${this.type().toUpperCase()}`,
            `*${new Date().toLocaleDateString('en-GB')}*`,
            `**Customer:**\n${submission.customer}`,
            `**Items ${pastTense}:**\n${lines.join('\n')}`,
            `**Total Silver:**\n${total}`
        ];

        const comment = submission.comment?.trim();
        if (comment) sections.push(`**Comment:**\n${comment}`);
        return sections.join('\n\n');
    }
}