import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AvatarCropDialogComponent } from './avatar-crop-dialog.component';

@Injectable({ providedIn: 'root' })
export class AvatarWorkflowService {
    private readonly dialog = inject(MatDialog);

    async selectAndCrop(): Promise<Uint8Array | null> {
        const file = await this.selectImage();
        if (!file) return null;

        const dialogRef = this.dialog.open(AvatarCropDialogComponent, {
            width: '420px',
            maxWidth: 'calc(100vw - 2rem)',
            data: file
        });
        return await firstValueFrom(dialogRef.afterClosed()) ?? null;
    }

    private selectImage(): Promise<File | null> {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
            input.addEventListener('cancel', () => resolve(null), { once: true });
            input.click();
        });
    }
}