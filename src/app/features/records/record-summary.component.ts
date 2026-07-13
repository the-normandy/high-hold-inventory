import { Component, computed, effect, ElementRef, inject, input, signal, viewChild, ViewChild } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { BalancePeriod, RecordEntry } from "./records.model";
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
  period = signal<BalancePeriod>('day');
  history = computed(() => this.recordService.buildBalanceHistory(this.data(), this.period()));

  lineChart = computed<ChartData<'line', number[], string>>(() => ({
      labels: this.history().map(p => p.label),
      datasets: [{
          label: 'Balance',
          data: this.history().map(p => p.balance),
          borderColor: this.colors.resolve().primary,
          backgroundColor: this.colors.resolve().primary,
          pointBackgroundColor: this.colors.resolve().primary,
          pointBorderColor: this.colors.resolve().primary,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          tension: 0.3,
          fill: false
      }]
  }));

  lineChartOptions = computed<ChartOptions<'line'>>(() => {
      const colors = this.colors.resolve();

      return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  display: false
              },
              tooltip: {
                  backgroundColor: colors.surface,
                  titleColor: colors.onSurface,
                  bodyColor: colors.onSurface,
                  borderColor: colors.outline,
                  borderWidth: 1
              }
          },
          scales: {
              x: {
                  ticks: { color: colors.onSurface },
                  grid: { color: colors.outlineVariant }
              },
              y: {
                  ticks: { color: colors.onSurface },
                  grid: { color: colors.outlineVariant }
              }
          }
      };
  });
}