import { Injectable } from "@angular/core";
import { BalancePeriod, BalancePoint, BalanceRange, CraftSubmission, EntryType, MaterialSubmission, RecordEntry, RecordSummary } from "./records.model";
import { BaseDirectory, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

@Injectable({
    providedIn: 'root'
})
export class RecordsService {
   
    private createMaterialRecord(material: MaterialSubmission, mode: string): RecordEntry {
        const entry = mode as EntryType;
        const silver = material.silver ?? 0;

        return {
            id: crypto.randomUUID(),
            entry: entry,
            source: 'material',
            timestamp: new Date().toISOString(),
            silver: silver,
            totalValue: material.items.reduce(
                (sum, item) => sum + item.item.price * item.quantity,
                0
            ) + silver,
            items: material.items.map(item => ({
                name: item.item.name,
                category: item.category,
                quantity: item.quantity,
                value: item.item.price
            }))
        };
    }

    private createCraftRecord(craft: CraftSubmission, mode: string): RecordEntry {
        const entry = mode as EntryType;

        return {
            id: crypto.randomUUID(),
            entry: entry,
            source: 'craft',
            timestamp: new Date().toISOString(),
            totalValue: craft.items.reduce(
                (sum, item) =>
                    sum +
                    (item.laborOnly ? item.item.labor! : item.item.price) *
                    item.quantity,
                0
            ),
            items: craft.items.map(item => ({
                name: item.item.name,
                category: item.category,
                quantity: item.quantity,
                value: item.laborOnly
                    ? item.item.labor!
                    : item.item.price
            }))
        };
    }

    private validate(mode: string) {
        return mode !== 'deposit' && mode !== 'withdraw';
    }

    buildSummary(records: RecordEntry[]): RecordSummary {
        const summary: RecordSummary = {
            depositedSilver: 0,
            withdrawnSilver: 0,
            balanceSilver: 0,

            depositedEntries: 0,
            withdrawnEntries: 0,

            materialEntries: 0,
            craftEntries: 0
        }

        for (const record of records) {
            if (record.entry === 'deposit') {
                summary.depositedEntries++;
                summary.depositedSilver += record.totalValue;
            } else {
                summary.withdrawnEntries++;
                summary.withdrawnSilver += record.totalValue;
            }

            if (record.source === 'material') {
                summary.materialEntries++;
            } else {
                summary.craftEntries++;
            }
        }

        summary.balanceSilver = summary.depositedSilver - summary.withdrawnSilver;
        return summary;
    }

    buildBalanceHistory(records: RecordEntry[], period: BalancePeriod, startingBalance = 0): BalancePoint[] {
        const sorted = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        const buckets = new Map<string, number>();

        let balance = startingBalance;

        for (const record of sorted) {
            balance += record.entry === 'deposit'
                ? record.totalValue
                : -record.totalValue

            const key = this.getBalanceKey(record.timestamp, period);
            buckets.set(key, balance);
        }

        return [...buckets.entries()].map(([period, balance]) => ({
            period,
            label: this.getLabel(period),
            balance
        }));
    }

    sliceBalanceHistory(records: RecordEntry[], range: BalanceRange): { records: RecordEntry[]; startingBalance: number; } {
        if (range === 'all') {
            return {
                records,
                startingBalance: 0
            };
        }

        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);

        switch (range) {
            case '30d':
                cutoff.setDate(cutoff.getDate() - 30);
                break;

            case '90d':
                cutoff.setDate(cutoff.getDate() - 90);
                break;
        }

        let startingBalance = 0;

        const visibleRecords = records.filter(record => {
            const timestamp = new Date(record.timestamp);

            if (timestamp < cutoff) {
                startingBalance += record.entry === 'deposit'
                    ? record.totalValue
                    : -record.totalValue;

                return false;
            }

            return true;
        });

        return {
            records: visibleRecords,
            startingBalance
        };
    }

    private getBalanceKey(timestamp: string, period: BalancePeriod): string {

        switch (period) {
            case 'day':
                return timestamp.slice(0, 10); // YYYY-MM-DD

            case 'month':
                return timestamp.slice(0, 7); // YYYY-MM

            case 'week':
                return this.getWeekKey(new Date(timestamp));
        }
    }

    private getLabel(period: string): string {
        if (period.includes('-W')) {
            // 2026-W29
            const [year, week] = period.split('-W').map(Number);

            const jan4 = new Date(year, 0, 4);
            const day = jan4.getDay() || 7;

            const monday = new Date(jan4);
            monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const start = monday.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            const end = sunday.toLocaleDateString('en-US', {
                month: monday.getMonth() === sunday.getMonth() ? undefined : 'short',
                day: 'numeric'
            });

            return `${start}–${end}`;
        }

        if (period.length === 7) {
            // 2026-07
            return new Date(`${period}-01`).toLocaleString(undefined, {
                month: 'short'
            });
        }

        if (period.length === 10) {
            // 2026-07-13
            return new Date(period).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
        }

        return period;
    }

    private getWeekKey(date: Date): string {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));

        const weekYear = d.getFullYear();
        const week1 = new Date(weekYear, 0, 4);

        week1.setDate(week1.getDate() + 3 - ((week1.getDay() + 6) % 7));
        const week = 1 +Math.round(
                (d.getTime() - week1.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            );

        return `${weekYear}-W${week.toString().padStart(2, '0')}`;
    }

    async recordMaterialSubmission(material: MaterialSubmission, mode: string): Promise<void> {
        if (this.validate(mode)) return;

        const entry = this.createMaterialRecord(material, mode);
        return this.writeRecord(entry);
    }

    async recordCraftSubmission(craft: CraftSubmission, mode: string): Promise<void> {
        if (this.validate(mode)) return;

        const entry = this.createCraftRecord(craft, mode);
        return this.writeRecord(entry);
    }

    async writeRecord(entry: RecordEntry): Promise<void> {
        let records: RecordEntry[] = [];

        if (await exists('ledger.json', { baseDir: BaseDirectory.AppLocalData })) {
            const text = await readTextFile('ledger.json', {
                baseDir: BaseDirectory.AppLocalData
            });

            if (text.trim().length > 0) {
                records = JSON.parse(text) as RecordEntry[];
            }
        }

        records.push(entry);
        records.sort(
            (a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        await writeTextFile('ledger.json', JSON.stringify(records, null, 2), {baseDir: BaseDirectory.AppLocalData});
    }

    async load(): Promise<RecordEntry[]> {
        if (!(await exists('ledger.json', { baseDir: BaseDirectory.AppLocalData }))) {
            await writeTextFile(
                'ledger.json',
                '[]',
                { baseDir: BaseDirectory.AppLocalData }
            );

            return [];
        }

        const text = await readTextFile('ledger.json', {
            baseDir: BaseDirectory.AppLocalData
        });

        return JSON.parse(text) as RecordEntry[];
    }

    async delete(id: string): Promise<void> {
        try {
            const text = await readTextFile('ledger.json', {
                baseDir: BaseDirectory.AppLocalData
            });

            const records = JSON.parse(text) as RecordEntry[];

            const filtered = records.filter(record => record.id !== id);

            await writeTextFile(
                'ledger.json',
                JSON.stringify(filtered, null, 2),
                {
                    baseDir: BaseDirectory.AppLocalData
                }
            );
        } catch (e) {
            throw new Error('Failed to delete ledger entry.');
        }
    }
}