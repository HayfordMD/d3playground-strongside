import { Routes } from '@angular/router';
import { YamlDataTableComponent } from './yaml-data-table/yaml-data-table.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'yaml-data', component: YamlDataTableComponent }
];
