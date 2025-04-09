import { Component } from '@angular/core';

@Component({
  selector: 'app-sunburst',
  standalone: true,
  template: `
    <div class="chart-container">
      <svg width="800" height="800"></svg>
    </div>
  `,
  styles: [`
    .chart-container {
      margin: 20px auto;
      width: fit-content;
    }
    svg {
      display: block;
    }
    path {
      stroke: #fff;
      stroke-width: 0.5px;
    }
  `]
})
export class SunburstComponent {

}
