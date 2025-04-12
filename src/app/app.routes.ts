import { Routes } from '@angular/router';
import { YamlDataTableComponent } from './yaml-data-table/yaml-data-table.component';
import { HomeComponent } from './home/home.component';
import { TreemapComponent } from './treemap/treemap.component';
import { AiCreatedExampleComponent } from './ai-created-example/ai-created-example.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'yaml-data', component: YamlDataTableComponent },
  { path: 'treemap', component: TreemapComponent },
  { path: 'ai-created-example', component: AiCreatedExampleComponent }
];
