import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTreeModule } from "@angular/material/tree";

@Component({
    selector: 'app-data',
    templateUrl: 'data.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatButtonModule, MatTreeModule
    ]
})
export class DataComponent {

}