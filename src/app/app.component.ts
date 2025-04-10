import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <h1>Offensive Breakdown Analysis</h1>
    <div class="pie-chart-container">
      <h2>Run vs Pass Distribution</h2>
      <div #pieChart></div>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Arial', sans-serif;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }
    .pie-chart-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h2 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
  `],
})
export class AppComponent implements OnInit {
  @ViewChild('pieChart', { static: true }) private pieChartContainer!: ElementRef;

  ngOnInit() {
    this.createRunPassPieChart();
  }

  private createRunPassPieChart(): void {
    // Use data directly from YAML structure
    // Based on the YAML file, Run has 11 plays and Pass has 9 plays
    const runPassData = [
      { category: 'Run', count: 11 },  // Count from YAML
      { category: 'Pass', count: 9 }   // Count from YAML
    ];
    
    this.renderPieChart(runPassData);
  }

  private renderPieChart(data: {category: string, count: number}[]): void {
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

    // Color scale - use football colors
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Run', 'Pass'])
      .range(['#1f77b4', '#ff7f0e']); // Blue for Run, Orange for Pass

    // Compute the position of each group on the pie
    const pie = d3.pie<any>()
      .value(d => d.count);

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
      .attr('fill', d => colorScale(d.data.category))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .style('transition', 'transform 0.2s ease-out')
      .on('mouseover', function(event, d) {
        // Calculate percentage
        const total = d3.sum(data, d => d.count);
        const percent = Math.round((d.data.count / total) * 100);
        
        // Hide the category label when showing percentage
        svg.selectAll('.pie-label').filter(function(labelData: any) {
          return labelData.data.category === d.data.category;
        }).style('opacity', 0);
          
        // Add percentage tooltip
        const tooltip = svg.append('text')
          .attr('class', 'percent-tooltip')
          .attr('text-anchor', 'middle')
          .attr('transform', `translate(${arc.centroid(d)})`)
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .style('fill', '#fff')
          .text(`${percent}%`);

        
        // Scale up the pie section
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1.1)')
          .style('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        // Remove percentage tooltip
        svg.selectAll('.percent-tooltip').remove();
        
        // Restore the category label
        svg.selectAll('.pie-label').filter(function(labelData: any) {
          return labelData.data.category === d.data.category;
        }).style('opacity', 1);
        
        // Scale down the pie section
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1)')
          .style('opacity', 0.8);
      });

    // Add permanent category labels inside the pie sections
    svg.selectAll('.pie-label')
      .data(pieData)
      .join('text')
      .attr('class', 'pie-label')
      .text(d => d.data.category)
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#fff');

    // Add a legend
    const legend = svg.selectAll('.legend')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(-${width/3}, ${i * 30 - height/4})`);

    legend.append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .style('fill', d => colorScale(d.data.category));

    legend.append('text')
      .attr('x', 30)
      .attr('y', 10)
      .attr('dy', '.35em')
      .style('font-size', '14px')
      .text(d => `${d.data.category} (${d.data.count} plays)`);
  }
}
