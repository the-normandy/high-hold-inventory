import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'app-missing-prices-dialog',
    templateUrl: 'missing-prices-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatDialogModule, MatIconModule]
})
export class MissingPricesDialogComponent {}