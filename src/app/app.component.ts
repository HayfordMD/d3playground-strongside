import { Component } from '@angular/core';
import { SunburstComponent } from './sunburst/sunburst.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SunburstComponent],
  template: `
    <h1>D3 Sunburst Chart</h1>
    <app-sunburst></app-sunburst>
  `,
  styles: [`
    h1 {
      text-align: center;
      margin: 20px 0;
    }
  `]
})
export class AppComponent {}
