import { Routes } from '@angular/router';
import { PiechartExample1Component } from './piechart-example1/piechart-example1.component';
import { SunburstChartComponent } from './sunburst-chart/sunburst-chart.component';

export const routes: Routes = [
    { path: 'piechart1', component: PiechartExample1Component },
    { path: 'sunburst', component: SunburstChartComponent },
    { path: '', redirectTo: '/sunburst', pathMatch: 'full' }
];
