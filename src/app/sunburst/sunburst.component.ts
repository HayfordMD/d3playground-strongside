import { Component, ElementRef, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
}

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
      cursor: pointer;
    }
    path {
      stroke: #fff;
      stroke-width: 0.5px;
      transition: opacity 0.3s;
    }
    path:hover {
      opacity: 0.8;
    }
  `]
})
export class SunburstComponent implements AfterViewInit {
  private data: SunburstNode = {
    name: "root",
    children: [
      {name: "A", value: 100},
      {name: "B", value: 200},
      {name: "C", value: 300, children: [
        {name: "C1", value: 100},
        {name: "C2", value: 200}
      ]}
    ]
  };

  private width = 800;
  private height = 800;
  private radius = Math.min(this.width, this.height) / 2;
  private currentFocus: any = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const svg = d3.select(this.el.nativeElement).select('svg');
    
    const root = d3.hierarchy(this.data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const partition = d3.partition<SunburstNode>()
      .size([2 * Math.PI, this.radius])(root);

    const color = d3.scaleOrdinal<string>()
      .domain(this.data.children?.map(d => d.name) || [])
      .range(d3.quantize(d3.interpolateRainbow, this.data.children?.length || 0 + 1));

    const arc = d3.arc<d3.HierarchyRectangularNode<SunburstNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(this.radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    const g = svg.append('g')
      .attr('transform', `translate(${this.width/2},${this.height/2})`);

    const path = g.selectAll('path')
      .data(partition.descendants().filter(d => d.depth))
      .enter().append('path')
        .attr('fill', d => { 
          while (d.depth > 1) d = d.parent!; 
          return color(d.data.name); 
        })
        .attr('d', arc)
        .on('click', (event, d) => this.handleClick(d));

    g.selectAll('text')
      .data(partition.descendants().filter(d => d.depth && (d.y0 + d.y1)/2 * (d.x1 - d.x0) > 10))
      .enter().append('text')
        .attr('transform', d => {
          const x = (d.x0 + d.x1)/2 * 180/Math.PI;
          const y = (d.y0 + d.y1)/2;
          return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr('dy', '0.35em')
        .text(d => d.data.name);

    // Add zoom behavior
    const svgElement = this.el.nativeElement.querySelector('svg');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${this.width/2},${this.height/2}) scale(${event.transform.k})`);
      });
    
    d3.select<SVGSVGElement, unknown>(svgElement).call(zoom);
  }

  private handleClick(d: any): void {
    // Handle click to focus/defocus segments
    if (this.currentFocus === d) {
      // Reset zoom if clicking the same segment
      d3.select(this.el.nativeElement).select('g')
        .transition()
        .duration(750)
        .attr('transform', `translate(${this.width/2},${this.height/2}) scale(1)`);
      this.currentFocus = null;
    } else {
      // Zoom to clicked segment
      const x = (d.x0 + d.x1)/2 * 180/Math.PI;
      const y = (d.y0 + d.y1)/2;
      const scale = 2; // Zoom scale factor
      
      d3.select(this.el.nativeElement).select('g')
        .transition()
        .duration(750)
        .attr('transform', `
          translate(${this.width/2},${this.height/2})
          scale(${scale})
          rotate(${-x})
          translate(${-y},0)
          rotate(${x})
        `);
      
      this.currentFocus = d;
    }
  }
}
