import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { RecordDeleteComponent } from '../records/record-delete.component';
import { CommerceEntry } from './commerce.model';
import { CommerceService } from './commerce.service';
import { CommerceSummaryComponent } from './commerce-summary.component';
import { CommerceViewComponent } from './commerce-view.component';

@Component({
    selector: 'app-commerce-ledger',
    templateUrl: 'commerce-ledger.component.html',
    styles: `:host { @apply flex-1; }`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DatePipe,
        RouterLink,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        CommerceSummaryComponent
    ]
})
export class CommerceLedgerComponent implements OnInit {
    private readonly commerceService = inject(CommerceService);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly sort = viewChild.required(MatSort);
    private readonly paginator = viewChild.required(MatPaginator);

    readonly entries = signal<CommerceEntry[]>([]);
    readonly dataSource = new MatTableDataSource<CommerceEntry>();
    readonly columns = ['timestamp', 'type', 'customer', 'items', 'totalValue', 'comment', 'actions'];

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort();
        this.dataSource.paginator = this.paginator();
    }

    viewEntry(entry: CommerceEntry): void {
        this.dialog.open(CommerceViewComponent, {
            width: '850px',
            maxWidth: '100vw',
            data: entry
        });
    }

    async deleteEntry(entry: CommerceEntry): Promise<void> {
        const dialogRef = this.dialog.open(RecordDeleteComponent, { width: '600px' });
        if (!await firstValueFrom(dialogRef.afterClosed())) return;

        try {
            await this.commerceService.delete(entry.id);
            await this.loadData();
            this.snackBar.open('Commerce entry deleted.', 'OK', { duration: 2000 });
        } catch {
            this.snackBar.open('Failed to delete commerce entry.', 'OK', { duration: 2000 });
        }
    }

    private async loadData(): Promise<void> {
        const entries = await this.commerceService.load();
        this.entries.set(entries);
        this.dataSource.data = entries;
    }
}