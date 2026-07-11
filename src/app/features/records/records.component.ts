import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatTableModule } from "@angular/material/table";

@Component({
    selector: 'app-records',
    templateUrl: 'records.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatTableModule, MatPaginatorModule, MatCardModule, MatButtonModule
    ]
})
export class RecordsComponent {

}