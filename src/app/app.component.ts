import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <h1>Welcome to {{title}}!</h1>
    <div class="pie-chart-container">
      <h2>D3.js Pie Chart Example</h2>
      <div #pieChart></div>
    </div>
  `,
  styles: [`
    .pie-chart-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
    }
  `],
})
export class AppComponent implements OnInit {
  title = 'D3 Playground';
  @ViewChild('pieChart', { static: true }) private pieChartContainer!: ElementRef;

  ngOnInit() {
    this.createPieChart();
  }

  private createPieChart(): void {
    const data = [
      { label: 'Category A', value: 30 },
      { label: 'Category B', value: 25 },
      { label: 'Category C', value: 15 },
      { label: 'Category D', value: 20 },
      { label: 'Category E', value: 10 }
    ];

    const element = this.pieChartContainer.nativeElement;
    const width = 450;
    const height = 450;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    // Clear any existing SVG
    d3.select(element).select('svg').remove();

    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(d3.schemeCategory10);

    // Compute the position of each group on the pie
    const pie = d3.pie<any>()
      .value(d => d.value);

    const pieData = pie(data);

    // Build the pie chart
    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    // Add the arcs
    svg.selectAll('path')
      .data(pieData)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label) as string)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.7)
      .style('transition', 'transform 0.2s ease-out')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1.1)')
          .style('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1)')
          .style('opacity', 0.7);
      });

    // Add labels
    svg.selectAll('text')
      .data(pieData)
      .join('text')
      .text(d => d.data.label)
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold');

    // Add a legend
    const legend = svg.selectAll('.legend')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(-${width/3}, ${i * 20 - height/3})`);

    legend.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', d => color(d.data.label) as string);

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .text(d => `${d.data.label} (${d.data.value})`);
  }
}
