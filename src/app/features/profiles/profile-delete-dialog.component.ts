import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UserProfile } from '../../core/user/user.model';

@Component({
    selector: 'app-profile-delete-dialog',
    templateUrl: 'profile-delete-dialog.component.html',
    imports: [MatButtonModule, MatDialogModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileDeleteDialogComponent {
    protected readonly profile = inject<UserProfile>(MAT_DIALOG_DATA);
}