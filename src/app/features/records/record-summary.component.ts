import { Component, computed, inject, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RecordEntry } from "./records.model";
import { RecordsService } from "./records.service";
import { ThemeStore } from "../../core/theme/theme.store";
import { ColorStore } from "../../shared/color.store";
import { ChartData, ChartOptions } from "chart.js";

@Component({
    selector: 'record-summary',
    templateUrl: 'record-summary.component.html',
    imports: [
        MatCardModule
    ]
})
export class RecordSummaryComponent {

    private readonly recordService = inject(RecordsService);
    private readonly colors = inject(ColorStore);
    theme = inject(ThemeStore);
    data = input.required<RecordEntry[]>();
    summary = computed(() => this.recordService.buildSummary(this.data()));

    pieChartColors = computed(() => this.theme.isDark()
        ? [this.colors.resolve().secondaryContainer, this.colors.resolve().tertiaryContainer]
        : [this.colors.resolve().secondary, this.colors.resolve().tertiary]
    );

    pieChartOptions: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
        legend: {
            position: 'right',
            labels: {
            color: this.colors.resolve().onSurface
            }
        },
        tooltip: {
            backgroundColor: this.colors.resolve().surface,
            titleColor: this.colors.resolve().onSurface,
            bodyColor: this.colors.resolve().onSurface,
            borderColor: this.colors.resolve().outline,
            borderWidth: 1
        }
        }
    };

    entriesChart = computed<ChartData<'pie', number[], string>>(() => ({
    labels: ['Deposits', 'Withdrawals'],
    datasets: [{
        data: [
        this.summary().depositedEntries,
        this.summary().withdrawnEntries
        ],
        backgroundColor: this.pieChartColors()
    }]
    }));

    sourceChart = computed<ChartData<'pie', number[], string>>(() => ({
    labels: ['Materials', 'Crafting'],
    datasets: [{
        data: [
        this.summary().materialEntries,
        this.summary().craftEntries
        ],
        backgroundColor: this.pieChartColors()
    }]
    }));
}