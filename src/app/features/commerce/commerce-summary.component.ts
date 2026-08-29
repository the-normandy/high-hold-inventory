import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Chart, ChartOptions } from 'chart.js/auto';
import { ColorStore } from '../../shared/color.store';
import { CommerceEntry, CommercePeriod, CommerceRange } from './commerce.model';
import { CommerceService } from './commerce.service';
import { input } from '@angular/core';

@Component({
    selector: 'commerce-summary',
    templateUrl: 'commerce-summary.component.html',
    styleUrl: 'commerce-summary.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatCardModule]
})
export class CommerceSummaryComponent implements OnDestroy {
    private readonly commerceService = inject(CommerceService);
    private readonly colors = inject(ColorStore);
    private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('balanceChart');
    private chart?: Chart<'line'>;

    readonly data = input.required<CommerceEntry[]>();
    readonly summary = computed(() => this.commerceService.buildSummary(this.data()));
    readonly period = signal<CommercePeriod>('day');
    readonly range = signal<CommerceRange>('30d');
    readonly visibleHistory = computed(() => {
        const slice = this.commerceService.sliceBalanceHistory(this.data(), this.range());
        return this.commerceService.buildBalanceHistory(slice.entries, this.period(), slice.startingBalance);
    });

    constructor() {
        effect(() => {
            const history = this.visibleHistory();
            const colors = this.colors.resolve();
            if (!this.chart) return;
            this.chart.data.labels = history.map(point => point.label);
            this.chart.data.datasets[0].data = history.map(point => point.balance);
            this.chart.data.datasets[0].borderColor = colors.primary;
            this.chart.data.datasets[0].backgroundColor = colors.primary;
            this.chart.update();
        });
    }

    ngAfterViewInit(): void {
        const colors = this.colors.resolve();
        this.chart = new Chart(this.canvas().nativeElement, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Net balance',
                    data: [],
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: this.chartOptions()
        });
        const history = this.visibleHistory();
        this.chart.data.labels = history.map(point => point.label);
        this.chart.data.datasets[0].data = history.map(point => point.balance);
        this.chart.update();
    }

    ngOnDestroy(): void {
        this.chart?.destroy();
    }

    updatePeriod(period: CommercePeriod): void {
        this.period.set(period);
    }

    updateRange(range: CommerceRange): void {
        this.range.set(range);
    }

    private chartOptions(): ChartOptions<'line'> {
        const colors = this.colors.resolve();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
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
    }
}