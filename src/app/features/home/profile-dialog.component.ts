import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AvatarWorkflowService } from '../../core/user/avatar-workflow.service';

export interface ProfileDialogData {
    canCancel: boolean;
}

@Component({
    selector: 'app-profile-dialog',
    templateUrl: 'profile-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        .profile-fields,
        .profile-field {
            display: flex;
            flex-direction: column;
        }

        .profile-fields {
            gap: 1rem;
        }

        .profile-field {
            gap: 0.25rem;
            color: var(--mat-sys-on-surface-variant);
            font-size: 0.75rem;
            font-weight: 500;
        }

        .profile-field input {
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
        }

        .profile-field input:focus-visible {
            border-color: var(--mat-sys-primary);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--mat-sys-primary) 28%, transparent);
        }
    `,
    imports: [MatDialogModule, MatButtonModule, MatIconModule, ReactiveFormsModule]
})
export class ProfileDialogComponent {
    protected readonly data = inject<ProfileDialogData | null>(MAT_DIALOG_DATA, { optional: true });
    private readonly dialogRef = inject(MatDialogRef<ProfileDialogComponent>);
    private readonly avatarWorkflow = inject(AvatarWorkflowService);
    private avatar: Uint8Array | undefined;
    private previewUrl: string | null = null;

    protected readonly preview = signal('/avatar.png');

    readonly form = new FormGroup({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.pattern(/\S/)]
        }),
        server: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.pattern(/\S/)]
        }),
        clan: new FormControl('', { nonNullable: true })
    });

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        });
    }

    protected async choosePhoto(): Promise<void> {
        const avatar = await this.avatarWorkflow.selectAndCrop();
        if (!avatar) return;

        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        this.avatar = avatar;
        this.previewUrl = URL.createObjectURL(new Blob([Uint8Array.from(avatar).buffer], { type: 'image/png' }));
        this.preview.set(this.previewUrl);
    }

    protected submit(): void {
        if (this.form.invalid) return;
        this.dialogRef.close({ ...this.form.getRawValue(), avatar: this.avatar });
    }
}