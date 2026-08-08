import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";

@Component({
    standalone: true,
    templateUrl: 'category-delete-dialog.component.html',
    imports: [MatButtonModule, MatDialogModule]
})
export class CategoryDeleteDialogComponent {
}
