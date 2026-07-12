import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { RecordEntry } from "./records.model";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { DatePipe } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { RecordViewComponent } from "./record-view.component";
import { RecordsService } from "./records.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RecordDeleteComponent } from "./record-delete.component";
import { firstValueFrom } from "rxjs";
import { RecordSummaryComponent } from "./record-summary.component";

@Component({
    selector: 'app-records',
    templateUrl: 'records.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatTableModule, MatPaginatorModule, MatCardModule, MatButtonModule, 
        MatSortModule, DatePipe, MatIconModule, MatDialogModule, MatTooltipModule, RecordSummaryComponent
    ]
})
export class RecordsComponent implements OnInit {

    async ngOnInit(): Promise<void> {
        await this.loadData(); 
    }

    ngAfterViewInit() {
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
    }

    columnsToDisplay = ['timestamp', 'entry', 'source', 'items', 'totalValue', 'actions'];
    records = signal<RecordEntry[]>([]);
    dataSource: MatTableDataSource<RecordEntry> = new MatTableDataSource<RecordEntry>();
    dialog = inject(MatDialog);
    snackBar = inject(MatSnackBar);
    recordService = inject(RecordsService);
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    async loadData() {
        const records = await this.recordService.load();
        this.records.set(records);
        this.dataSource.data = records;
    }

    viewRecord(record: RecordEntry) {
        this.dialog.open(RecordViewComponent, {width: '800px',  maxWidth: '100vw', data: record});
    }

async deleteRecord(record: RecordEntry): Promise<void> {
    const dialogRef = this.dialog.open(RecordDeleteComponent, {width: '600px'});

    const confirm = await firstValueFrom(dialogRef.afterClosed());
    if (!confirm) return;

    try {
        await this.recordService.delete(record.id);
        await this.loadData();
        this.snackBar.open('Record deleted successfully', 'OK', {duration: 2000});
    } catch {
        this.snackBar.open('Failed to delete record', 'OK', {duration: 2000});
    }
}

}