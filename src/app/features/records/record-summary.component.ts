import { Component, computed, effect, ElementRef, inject, input, signal, viewChild, ViewChild } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { BalancePeriod, BalanceRange, RecordEntry } from "./records.model";
import { RecordsService } from "./records.service";
import { ThemeStore } from "../../core/theme/theme.store";
import { ColorStore } from "../../shared/color.store";
import { Chart, ChartData, ChartOptions } from "chart.js/auto";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: 'record-summary',
    templateUrl: 'record-summary.component.html',
    styleUrl: 'record-summary.component.css',
    imports: [
        MatCardModule, MatButtonModule
    ]
})
export class RecordSummaryComponent {

    private readonly recordService = inject(RecordsService);
    private readonly colors = inject(ColorStore);
    theme = inject(ThemeStore);
    data = input.required<RecordEntry[]>();
    summary = computed(() => this.recordService.buildSummary(this.data()));
    period = signal<BalancePeriod>('day');
    canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('balanceChart');
    private chart?: Chart<'line'>;
    history = computed(() => this.recordService.buildBalanceHistory(this.data(), this.period()));
    visibleHistory = computed(() => {
        const sliced = this.recordService.sliceBalanceHistory(this.data(), this.range());
        return this.recordService.buildBalanceHistory(sliced.records, this.period(), sliced.startingBalance);
    });

    range = signal<BalanceRange>('30d');

    constructor() {
        effect(() => {
            this.history();
            this.colors.resolve();
            this.visibleHistory();

            this.updateChart();
        });
    }

    ngAfterViewInit() {
        this.chart = new Chart(this.canvas().nativeElement, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Balance',
                    data: [],
                    borderColor: this.colors.resolve().primary,
                    backgroundColor: this.colors.resolve().primary,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: this.lineChartOptions()
        });
    }

    lineChart = computed<ChartData<'line', number[], string>>(() => ({
        labels: this.visibleHistory().map(p => p.label),
        datasets: [{
            label: 'Balance',
            data: this.visibleHistory().map(p => p.balance),
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

    updatePeriod(period: BalancePeriod) {
        if (!this.chart) return;
        this.period.set(period);
        this.chart.update();
    }

    updateRange(range: BalanceRange) {
        if (!this.chart) return;
        this.range.set(range);
        this.chart.update();
    }

    private updateChart() {
        if (!this.chart) return;

        const history = this.visibleHistory();
        const colors = this.colors.resolve();

        this.chart.data.labels = history.map(x => x.label);
        this.chart.data.datasets[0].data = history.map(x => x.balance);

        this.chart.data.datasets[0].borderColor = colors.primary;
        this.chart.data.datasets[0].backgroundColor = colors.primary;

        this.chart.update();
    }
}