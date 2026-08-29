import { Injectable } from '@angular/core';
import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import {
    CommerceBalancePoint,
    CommerceEntry,
    CommercePeriod,
    CommerceRange,
    CommerceSubmission,
    CommerceSummary,
    CommerceType
} from './commerce.model';

const COMMERCE_LEDGER_FILE = 'ledger-commerce.json';

@Injectable({
    providedIn: 'root'
})
export class CommerceService {
    async record(submission: CommerceSubmission, type: CommerceType): Promise<CommerceEntry> {
        const entry: CommerceEntry = {
            id: crypto.randomUUID(),
            type,
            timestamp: new Date().toISOString(),
            customer: submission.customer.trim(),
            comment: submission.comment?.trim() || undefined,
            items: submission.items.map(item => ({
                source: item.source,
                category: item.path.join(' / '),
                name: item.item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })),
            totalValue: submission.items.reduce(
                (total, item) => total + item.quantity * item.unitPrice,
                0
            )
        };

        const entries = await this.load();
        entries.push(entry);
        entries.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
        await this.write(entries);
        return entry;
    }

    async load(): Promise<CommerceEntry[]> {
        if (!(await exists(COMMERCE_LEDGER_FILE, { baseDir: BaseDirectory.AppLocalData }))) {
            await this.write([]);
            return [];
        }

        const text = await readTextFile(COMMERCE_LEDGER_FILE, {
            baseDir: BaseDirectory.AppLocalData
        });

        return text.trim() ? JSON.parse(text) as CommerceEntry[] : [];
    }

    async delete(id: string): Promise<void> {
        const entries = await this.load();
        await this.write(entries.filter(entry => entry.id !== id));
    }

    buildSummary(entries: CommerceEntry[]): CommerceSummary {
        const summary: CommerceSummary = {
            purchasedValue: 0,
            soldValue: 0,
            netBalance: 0,
            purchaseEntries: 0,
            saleEntries: 0
        };

        for (const entry of entries) {
            if (entry.type === 'sale') {
                summary.saleEntries++;
                summary.soldValue += entry.totalValue;
            } else {
                summary.purchaseEntries++;
                summary.purchasedValue += entry.totalValue;
            }
        }

        summary.netBalance = summary.soldValue - summary.purchasedValue;
        return summary;
    }

    buildBalanceHistory(entries: CommerceEntry[], period: CommercePeriod, startingBalance = 0): CommerceBalancePoint[] {
        const balances = new Map<string, number>();
        let balance = startingBalance;

        for (const entry of [...entries].sort((left, right) => left.timestamp.localeCompare(right.timestamp))) {
            balance += this.signedValue(entry);
            const key = this.getBalanceKey(entry.timestamp, period);
            balances.set(key, balance);
        }

        return [...balances.entries()].map(([key, pointBalance]) => ({
            period: key,
            label: this.getLabel(key),
            balance: pointBalance
        }));
    }

    sliceBalanceHistory(entries: CommerceEntry[], range: CommerceRange): { entries: CommerceEntry[]; startingBalance: number } {
        if (range === 'all') {
            return { entries, startingBalance: 0 };
        }

        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);
        cutoff.setDate(cutoff.getDate() - (range === '30d' ? 30 : 90));

        let startingBalance = 0;
        const visibleEntries = entries.filter(entry => {
            if (new Date(entry.timestamp) < cutoff) {
                startingBalance += this.signedValue(entry);
                return false;
            }
            return true;
        });

        return { entries: visibleEntries, startingBalance };
    }

    private signedValue(entry: CommerceEntry): number {
        return entry.type === 'sale' ? entry.totalValue : -entry.totalValue;
    }

    private async write(entries: CommerceEntry[]): Promise<void> {
        await writeTextFile(
            COMMERCE_LEDGER_FILE,
            JSON.stringify(entries, null, 2),
            { baseDir: BaseDirectory.AppLocalData }
        );
    }

    private getBalanceKey(timestamp: string, period: CommercePeriod): string {
        if (period === 'day') return timestamp.slice(0, 10);
        if (period === 'month') return timestamp.slice(0, 7);
        return this.getWeekKey(new Date(timestamp));
    }

    private getLabel(period: string): string {
        if (period.includes('-W')) {
            const [year, week] = period.split('-W').map(Number);
            const januaryFourth = new Date(year, 0, 4);
            const day = januaryFourth.getDay() || 7;
            const monday = new Date(januaryFourth);
            monday.setDate(januaryFourth.getDate() - day + 1 + (week - 1) * 7);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const start = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const end = sunday.toLocaleDateString('en-US', {
                month: monday.getMonth() === sunday.getMonth() ? undefined : 'short',
                day: 'numeric'
            });
            return `${start}-${end}`;
        }

        if (period.length === 7) {
            return new Date(`${period}-01`).toLocaleString(undefined, { month: 'short' });
        }

        if (period.length === 10) {
            return new Date(period).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }

        return period;
    }

    private getWeekKey(date: Date): string {
        const thursday = new Date(date);
        thursday.setHours(0, 0, 0, 0);
        thursday.setDate(thursday.getDate() + 3 - ((thursday.getDay() + 6) % 7));
        const year = thursday.getFullYear();
        const firstThursday = new Date(year, 0, 4);
        firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
        const week = 1 + Math.round(
            (thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        return `${year}-W${week.toString().padStart(2, '0')}`;
    }
}