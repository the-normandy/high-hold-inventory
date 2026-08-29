import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";

@Component({
    templateUrl: 'webhook-dialog.component.html',
    styles: `
        .webhook-field {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            padding-top: 0.25rem;
            color: var(--mat-sys-on-surface-variant);
            font-size: 0.75rem;
            font-weight: 500;
        }

        .webhook-field input {
            width: 100%;
            height: 2.5rem;
            padding: 0 0.75rem;
            border: 1px solid var(--mat-sys-outline);
            border-radius: 0.375rem;
            outline: none;
            background: var(--mat-sys-surface);
            color: var(--mat-sys-on-surface);
            font-size: 0.875rem;
            font-weight: 400;
            transition: border-color 120ms ease, box-shadow 120ms ease;
        }

        .webhook-field input:hover {
            border-color: var(--mat-sys-on-surface);
        }

        .webhook-field input:focus-visible {
            border-color: var(--mat-sys-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--mat-sys-primary) 28%, transparent);
        }
    `,
    imports: [
        MatDialogModule,
        ReactiveFormsModule,
        MatButtonModule
    ]
})
export class WebhookDialogComponent {
    url = new FormControl('');
}