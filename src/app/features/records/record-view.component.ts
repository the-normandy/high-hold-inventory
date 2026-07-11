import { Component, inject, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RecordEntry, RecordItem } from "./records.model";
import { MatCardModule } from "@angular/material/card";
import { DatePipe } from "@angular/common";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";

@Component({
    selector: 'record-view',
    templateUrl: 'record-view.component.html',
    imports: [
        MatButtonModule, DatePipe, MatDialogModule
    ]
})
export class RecordViewComponent {
    record = inject<RecordEntry>(MAT_DIALOG_DATA);
    snackBar = inject(MatSnackBar);

    copy() {
        const record = this.record;
        const pad = (value: string | number, width: number) => String(value).padEnd(width);

        const lines = [
            `${new Date(record.timestamp).toISOString().slice(0, 10)} ${record.entry} of ${record.source}`,
            '',
            `${pad('Name', 20)} ${pad('Category', 15)} ${pad('Qty', 5)} ${pad('Value', 10)}`,
            ...record.items.map(item => `${pad(item.name, 20)} ${pad(item.category, 15)} ${pad(item.quantity, 5)} ${pad(item.value, 10)}`)
        ];

        const text = ["```", ...lines, "```"].join("\n");
    
        navigator.clipboard.writeText(text).then(() => {
            this.snackBar.open('Copied to clipboard', 'Dismiss', {duration: 2000})
        });
    }
}