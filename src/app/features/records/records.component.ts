import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { RecordEntry, RecordItem } from "./records.model";
import { BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { DatePipe } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { RecordViewComponent } from "./record-view.component";

@Component({
    selector: 'app-records',
    templateUrl: 'records.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatTableModule, MatPaginatorModule, MatCardModule, MatButtonModule, 
        MatSortModule, DatePipe, MatIconModule, MatDialogModule
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

    columnsToDisplay = ['date', 'entry', 'source', 'items', 'totalValue'];
    records = signal<RecordEntry[]>([]);
    dataSource: MatTableDataSource<RecordEntry> = new MatTableDataSource<RecordEntry>();
    dialog = inject(MatDialog);
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    async loadData() {
        this.records.set(JSON.parse(
            await readTextFile('ledger.json', {baseDir: BaseDirectory.AppLocalData})
        ) as RecordEntry[]);

        this.dataSource.data = this.records();
    }

    viewRecord(record: RecordEntry) {
        const dialogRef = this.dialog.open(RecordViewComponent, {width: '800px'})
    }

}