import { Component, computed, effect, ElementRef, inject, input, viewChild, ViewChild } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RecordEntry } from "./records.model";
import { RecordsService } from "./records.service";
import { ThemeStore } from "../../core/theme/theme.store";
import { ColorStore } from "../../shared/color.store";
import { Chart, ChartData, ChartOptions } from "chart.js/auto";

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
    // history = computed(() => this.recordService.buildBalanceHistory(this.data(), this.period()));

    pieChartColors = computed(() => this.theme.isDark()
        ? ['#60A5FA', '#FB923C']
        : ['#2563EB', '#EA580C']
    );

    pieChartOptions = computed<ChartOptions<'pie'>>(() => {
    const colors = this.colors.resolve();

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
        legend: {
            position: 'right',
            labels: {
            color: colors.onSurface
            }
        },
        tooltip: {
            backgroundColor: colors.surface,
            titleColor: colors.onSurface,
            bodyColor: colors.onSurface,
            borderColor: colors.outline,
            borderWidth: 1
        }
        }
    };
    });
}