import { Routes } from '@angular/router';
import { ActionsComponent } from './features/actions/actions.component';
import { HomeComponent } from './features/home/home.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { DataComponent } from './features/data/data.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'new', component: ActionsComponent},
    {path: 'new/:mode', component: InventoryComponent},
    {path: 'data', component: DataComponent}
];
