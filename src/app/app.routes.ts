import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { DataComponent } from './features/data/data.component';
import { RecordsComponent } from './features/records/records.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'new/:mode', component: InventoryComponent},
    {path: 'data', component: DataComponent},
    {path: 'records', component: RecordsComponent}
];
