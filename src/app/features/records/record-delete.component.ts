import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";

@Component({
    selector: 'record-delete',
    templateUrl: 'record-delete.component.html',
    imports: [
        MatButtonModule, MatDialogModule
    ]
})
export class RecordDeleteComponent {
    
}