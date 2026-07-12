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

    entriesCanvas = viewChild<ElementRef<HTMLCanvasElement>>('entriesCanvas');
    sourceCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sourceCanvas');

    private entriesChartInstance?: Chart;
    private sourceChartInstance?: Chart;

    private readonly recordService = inject(RecordsService);
    private readonly colors = inject(ColorStore);
    theme = inject(ThemeStore);
    data = input.required<RecordEntry[]>();
    summary = computed(() => this.recordService.buildSummary(this.data()));

  constructor() {
    effect(() => {
      const entriesCanvas = this.entriesCanvas()?.nativeElement;
      const sourceCanvas = this.sourceCanvas()?.nativeElement;

      if (!entriesCanvas || !sourceCanvas) {
        return;
      }

      this.entriesChartInstance?.destroy();
      this.sourceChartInstance?.destroy();

      this.entriesChartInstance = new Chart(entriesCanvas, {
        type: 'pie',
        data: this.entriesChart(),
        options: this.pieChartOptions
      });

      this.sourceChartInstance = new Chart(sourceCanvas, {
        type: 'pie',
        data: this.sourceChart(),
        options: this.pieChartOptions
      });
    });
  }

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