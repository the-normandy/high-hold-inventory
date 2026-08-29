import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { Settings } from "../../core/settings/settings.model";

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    styles: `
        .settings-fields,
        .settings-field {
            display: flex;
            flex-direction: column;
        }

        .settings-fields {
            gap: 1rem;
        }

        .settings-field {
            gap: 0.25rem;
            color: var(--mat-sys-on-surface-variant);
            font-size: 0.75rem;
            font-weight: 500;
        }

        .settings-field input {
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

        .settings-field input:hover {
            border-color: var(--mat-sys-on-surface);
        }

        .settings-field input:focus-visible {
            border-color: var(--mat-sys-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--mat-sys-primary) 28%, transparent);
        }
    `,
    imports: [
        MatDialogModule, MatButtonModule, ReactiveFormsModule
    ]
})
export class SettingsDialogComponent {
    private readonly settings = inject<Settings | null>(MAT_DIALOG_DATA, { optional: true });

    form = new FormGroup({
        clan: new FormControl(this.settings?.clan ?? '', {nonNullable: true}),
        character: new FormControl(this.settings?.character ?? '', {nonNullable: true})
    });
}