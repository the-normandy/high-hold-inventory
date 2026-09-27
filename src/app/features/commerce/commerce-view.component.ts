import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommerceEntry } from './commerce.model';

@Component({
    selector: 'commerce-view',
    templateUrl: 'commerce-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe, MatButtonModule, MatDialogModule]
})
export class CommerceViewComponent {
    readonly entry = inject<CommerceEntry>(MAT_DIALOG_DATA);
    private readonly snackBar = inject(MatSnackBar);

    async copy(): Promise<void> {
        const entry = this.entry;
        const pad = (value: string | number, width: number) => String(value).padEnd(width);
        const namePad = Math.max('Name'.length, ...entry.items.map(item => item.name.length)) + 5;

        const lines = [
            `${new Date(entry.timestamp).toISOString().slice(0, 10)} ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} for ${entry.customer}`,
            '',
            `${pad('Name', namePad)} ${pad('Source', 12)} ${pad('Category', 15)} ${pad('Qty', 5)} ${pad('Unit Price', 12)} ${pad('Value', 10)}`,
            ...entry.items.map(item => `${pad(item.name, namePad)} ${pad(item.source === 'material' ? 'Materials' : 'Craft', 12)} ${pad(item.category, 15)} ${pad(item.quantity, 5)} ${pad(item.unitPrice, 12)} ${pad(item.quantity * item.unitPrice, 10)}`),
            '',
            `Total: ${entry.totalValue} silver`,
            ...(entry.comment ? ['', `Comment: ${entry.comment}`] : [])
        ];

        await navigator.clipboard.writeText(['```', ...lines, '```'].join('\n'));
        this.snackBar.open('Copied to clipboard.', 'OK', { duration: 2000 });
    }
}