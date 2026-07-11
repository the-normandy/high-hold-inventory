import { Component, computed, inject, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RecordEntry } from "./records.model";
import { RecordsService } from "./records.service";

@Component({
    selector: 'record-summary',
    templateUrl: 'record-summary.component.html',
    imports: [
        MatCardModule
    ]
})
export class RecordSummaryComponent {

    private readonly recordService = inject(RecordsService);
    data = input.required<RecordEntry[]>();
    summary = computed(() => this.recordService.buildSummary(this.data()));
}