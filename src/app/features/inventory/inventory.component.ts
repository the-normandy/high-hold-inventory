import { Component, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MaterialComponent } from "./material.component";
import { CraftComponent } from "./craft.component";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DatePipe } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { CraftSubmission, MaterialSubmission } from "../records/records.model";
import { RecordsService } from "../records/records.service";

@Component({
    selector: 'app-inventory',
    templateUrl: 'inventory.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [MaterialComponent, CraftComponent, MatCheckboxModule, MatButtonModule, RouterModule]
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
    recordService = inject(RecordsService);
    mode = signal<string>('');
    fb = inject(FormBuilder);
    snackBar = inject(MatSnackBar);
    shouldRenderMaterial = signal<boolean>(false);
    shouldRenderCraft = signal<boolean>(false);

    craftForm = this.fb.group({
        comment: this.fb.control<string | null>(null),
        items: this.fb.array<FormGroup<any>>([])
    });

    materialForm = this.fb.group({
        comment: this.fb.control<string | null>(null),
        silver: this.fb.control<number | null>(null),
        items: this.fb.array<FormGroup<any>>([])
    });

    async submit() {
        const matSubmission = this.materialForm.getRawValue() as MaterialSubmission;
        const craftSubmission = this.craftForm.getRawValue() as CraftSubmission;

        const includeMaterial = this.shouldRenderMaterial();
        const includeCraft = this.shouldRenderCraft();

        const materialRows = includeMaterial ? matSubmission.items : [];
        const craftRows = includeCraft ? craftSubmission.items : [];

        if (includeMaterial && (materialRows.length > 0 || (matSubmission.silver !== null && matSubmission.silver > 0))) {
            await this.recordService.recordMaterialSubmission(matSubmission, this.mode());
        }

        if (includeCraft && craftRows.length > 0) {
            await this.recordService.recordCraftSubmission(craftSubmission, this.mode());
        }

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
            (includeMaterial ? (matSubmission.silver ?? 0) : 0);

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
                    `* ${row.quantity}x ${row.item.name} [${row.path.join(' / ')}] (${row.quantity * row.item.price})`
            ),
            ...craftRows.map(
                row =>
                    `* ${row.quantity}x ${row.item.name} [${row.path.join(' / ')}] (${
                        row.quantity *
                        (row.laborOnly ? row.item.labor! : row.item.price)
                    })`
            )
        ];

        const sections: string[] = [];

        sections.push(`## ${this.mode().toUpperCase()}`);
        sections.push(`*${date}*`);

        if (itemLines.length) {
            sections.push(`**Items ${label}:**
${itemLines.join('\n')}`);
        }

        if (includeMaterial) {
            sections.push(`**Total Silver in Materials:**
${materialTotal}`);
        }

        if (includeCraft) {
            sections.push(`**Total Silver in Crafting:**
${craftTotal}`);
        }

        if (
            includeMaterial &&
            matSubmission.silver !== null &&
            matSubmission.silver !== 0
        ) {
            sections.push(`**Silver ${silverLabel}:**
${matSubmission.silver}`);
        }

        sections.push(`**Total Silver:**
${grandTotal}`);

        const materialComment = matSubmission.comment?.trim();
        if (includeMaterial && materialComment) {
            sections.push(`**Materials Comment:**
${materialComment}`);
        }

        const craftComment = craftSubmission.comment?.trim();
        if (includeCraft && craftComment) {
            sections.push(`**Crafting Comment:**
${craftComment}`);
        }

        const output = sections.join('\n\n');

        await navigator.clipboard.writeText(output);
        this.snackBar.open('Copied to clipboard', 'OK', {
            duration: 2000
        });
    }
}