import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LegacyFile } from '../../core/data/legacy-data-migration.service';

@Component({
    selector: 'app-legacy-data-migration-dialog',
    templateUrl: 'legacy-data-migration-dialog.component.html',
    imports: [MatButtonModule, MatDialogModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegacyDataMigrationDialogComponent {
    protected readonly files = inject<readonly LegacyFile[]>(MAT_DIALOG_DATA);
}