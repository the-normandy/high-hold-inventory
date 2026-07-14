import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    imports: [
        MatDialogModule, MatButtonModule, MatInputModule, ReactiveFormsModule
    ]
})
export class SettingsDialogComponent {
    form = new FormGroup({
        clan: new FormControl('', {nonNullable: true}),
        character: new FormControl('', {nonNullable: true})
    });
}