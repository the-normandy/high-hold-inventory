import { Routes } from '@angular/router';
import { ActionsComponent } from './features/actions/actions.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { CraftComponent } from './features/inventory/craft.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'new', component: ActionsComponent},
    {path: ':mode/new', component: InventoryComponent},
    {path: 'crafting/:mode', component: CraftComponent}
];
