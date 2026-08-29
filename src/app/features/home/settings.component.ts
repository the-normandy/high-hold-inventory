import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { Settings } from "../../core/settings/settings.model";

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
    imports: [
        MatDialogModule, MatButtonModule, MatInputModule, ReactiveFormsModule
    ]
})
export class SettingsDialogComponent {
    private readonly settings = inject<Settings | null>(MAT_DIALOG_DATA, { optional: true });

    form = new FormGroup({
        clan: new FormControl(this.settings?.clan ?? '', {nonNullable: true}),
        character: new FormControl(this.settings?.character ?? '', {nonNullable: true})
    });
}