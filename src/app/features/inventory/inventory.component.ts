import { Component, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MaterialComponent } from "./material.component";
import { CraftComponent } from "./craft.component";
import { ActivatedRoute } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Category, CraftCategory, ItemData } from "../../core/data/item.model";
import { DatePipe } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";

@Component({
    selector: 'app-inventory',
    templateUrl: 'inventory.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [MaterialComponent, CraftComponent, MatCheckboxModule]
})
export class InventoryComponent implements OnInit {

    ngOnInit() {
        const param = this.route.snapshot.paramMap.get('mode');

        if (!param) {
            throw new Error('Route parameter not found');
        }

        this.mode.set(param.toLowerCase());
    }

    route = inject(ActivatedRoute);
    mode = signal<string>('');
    fb = inject(FormBuilder);
    snackBar = inject(MatSnackBar);
    shouldRenderMaterial = signal<boolean>(false);
    shouldRenderCraft = signal<boolean>(false);

    craftForm = this.fb.group({
        purpose: this.fb.control<string | null>(null),
        items: this.fb.array<FormGroup<any>>([])
    });

    materialForm = this.fb.group({
        purpose: this.fb.control<string | null>(null),
        silver: this.fb.control<number | null>(null),
        ownership: this.fb.control<string | null>(null),
        usage: this.fb.control<string | null>(null),
        items: this.fb.array<FormGroup<any>>([])
    });

    async submit() {
        const material = this.materialForm.getRawValue() as {
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

        const craft = this.craftForm.getRawValue() as {
            purpose: string | null;
            items: {
                category: CraftCategory | null;
                item: ItemData;
                quantity: number;
                laborOnly: boolean;
            }[];
        };

        const includeMaterial = this.shouldRenderMaterial();
        const includeCraft = this.shouldRenderCraft();

        const materialRows = includeMaterial ? material.items ?? [] : [];
        const craftRows = includeCraft ? craft.items ?? [] : [];

        const materialTotal = materialRows.reduce(
            (sum, row) => sum + row.quantity * row.item.price,
            0
        );

        const craftTotal = craftRows.reduce(
            (sum, row) =>
                sum +
                row.quantity *
                    (row.laborOnly ? row.item.labor! : row.item.price),
            0
        );

        const grandTotal =
            materialTotal +
            craftTotal +
            (includeMaterial ? (material.silver ?? 0) : 0);

        const label =
            this.mode() === 'deposit'
                ? 'deposited'
                : 'withdrawn';

        const silverLabel =
            this.mode() === 'deposit'
                ? 'given'
                : 'taken';

        const date = new DatePipe('en-GB').transform(
            new Date(),
            'dd-MM-yyyy'
        );

        const itemLines = [
            ...materialRows.map(
                row =>
                    `* ${row.quantity}x ${row.item.name} (${row.quantity * row.item.price})`
            ),
            ...craftRows.map(
                row =>
                    `* ${row.quantity}x ${row.item.name} (${
                        row.quantity *
                        (row.laborOnly ? row.item.labor! : row.item.price)
                    })`
            )
        ];

        const sections: string[] = [];

        sections.push(`## ${this.mode().toUpperCase()}`);
        sections.push(`*${date}*`);

        if (itemLines.length) {
            sections.push(`
    **Items ${label}:**
    ${itemLines.join('\n')}`);
        }

        if (includeMaterial) {
            sections.push(`
    **Total Silver in Materials:**
    ${materialTotal}`);
        }

        if (includeCraft) {
            sections.push(`
    **Total Silver in Crafting:**
    ${craftTotal}`);
        }

        if (
            includeMaterial &&
            material.silver !== null &&
            material.silver !== 0
        ) {
            sections.push(`
    **Silver ${silverLabel}:**
    ${material.silver}`);
        }

        sections.push(`
    **Total Silver:**
    ${grandTotal}`);

        if (includeMaterial && material.purpose) {
            sections.push(`
    **Purpose of Materials:**
    ${material.purpose}`);
        }

        if (includeCraft && craft.purpose) {
            sections.push(`
    **Purpose of Crafting:**
    ${craft.purpose}`);
        }

        if (includeMaterial && this.mode() === 'withdraw') {
            sections.push(`
    **Personal Use/Clan/Profit?**
    ${material.usage ?? ''}

    **For You, the Clan, or Militia Member?**
    ${material.ownership ?? ''}`);
        }

        const output = sections.join('\n\n');

        await navigator.clipboard.writeText(output);
        this.snackBar.open('Copied to clipboard', 'OK', {
            duration: 2000
        });
    }
}