import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
    standalone: true,
    templateUrl: 'category-dialog.component.html',
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule
    ]
})
export class CategoryDialogComponent {
    dialogRef = inject(MatDialogRef<CategoryDialogComponent>);

    form = new FormGroup({
        name: new FormControl('', [Validators.required])
    });

    get nameControl() {
        return this.form.get('name') as FormControl;
    }

    submit() {
        if (this.form.valid) {
            this.dialogRef.close(this.nameControl.value.trim());
        }
    }

    cancel() {
        this.dialogRef.close(null);
    }
}
