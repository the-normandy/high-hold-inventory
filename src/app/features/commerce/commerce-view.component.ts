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
        const lines = [
            `## ${this.entry.type.toUpperCase()}`,
            `*${new Date(this.entry.timestamp).toLocaleDateString('en-GB')}*`,
            `**Customer:**\n${this.entry.customer}`,
            `**Items:**\n${this.entry.items.map(item =>
                `* ${item.quantity}x ${item.name} [${item.source === 'material' ? 'Materials' : 'Craft'} / ${item.category}] @ ${item.unitPrice} each (${item.quantity * item.unitPrice})`
            ).join('\n')}`,
            `**Total Silver:**\n${this.entry.totalValue}`,
            ...(this.entry.comment ? [`**Comment:**\n${this.entry.comment}`] : [])
        ];
        await navigator.clipboard.writeText(lines.join('\n\n'));
        this.snackBar.open('Copied to clipboard.', 'OK', { duration: 2000 });
    }
}