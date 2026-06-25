import { Routes } from '@angular/router';
import { ActionsComponent } from './features/actions/actions.component';
import { CraftComponent } from './features/inventory/craft.component';
import { HomeComponent } from './features/home/home.component';
import { MaterialComponent } from './features/inventory/material.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'new', component: ActionsComponent},
    {path: ':mode/new', component: MaterialComponent},
    {path: 'crafting/:mode', component: CraftComponent}
];
