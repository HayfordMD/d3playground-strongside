import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { YamlDataService } from '../services/yaml-data.service';
import { FootballPlay } from '../models/football-play.model';
import { CommonModule } from '@angular/common';

interface TreemapData {
  name: string;
  children: TreemapItem[];
}

interface TreemapItem {
  name: string;
  value: number;
  avgYards: number;
  playType: string;
}

// Extended hierarchy node type for D3 treemap
interface TreemapNode extends d3.HierarchyNode<any> {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  data: {
    name: string;
    value?: number;
    avgYards?: number;
    playType?: string;
  };
}

@Component({
  selector: 'app-treemap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="treemap-container">
      <h1>Play Concept Treemap</h1>
      <p class="description">
        This treemap visualizes play concepts by frequency and effectiveness. 
        The size of each box represents how often a concept was called, 
        while the color indicates the average yards gained (green for more yards, red for fewer yards).
      </p>
      
      <div class="filter-container">
        <span class="filter-label">Filter by Play Type:</span>
        <button class="filter-button" [class.active]="selectedFilter === 'all'" (click)="filterData('all')">All Plays</button>
        <button class="filter-button" [class.active]="selectedFilter === 'run'" (click)="filterData('run')">Run Plays</button>
        <button class="filter-button" [class.active]="selectedFilter === 'pass'" (click)="filterData('pass')">Pass Plays</button>
      </div>
      
      <div class="data-info" *ngIf="dataSource">
        <p>Data Source: {{dataSource}}</p>
      </div>
      
      <div class="loading-error" *ngIf="error">
        <p>{{error}}</p>
      </div>
      
      <div class="loading-indicator" *ngIf="loading">
        <p>Loading data...</p>
      </div>
      
      <div #treemap class="treemap-chart"></div>
      
      <div class="legend">
        <div class="legend-title">Average Yards Gained</div>
        <div class="legend-scale">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #e74c3c;"></div>
            <div class="legend-label">Negative/Low</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f39c12;"></div>
            <div class="legend-label">Medium</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #2ecc71;"></div>
            <div class="legend-label">High</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Arial', sans-serif;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      display: block;
    }
    
    .treemap-container {
      width: 100%;
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 15px;
    }
    
    .description {
      text-align: center;
      margin-bottom: 20px;
      color: #7f8c8d;
      line-height: 1.5;
    }
    
    .filter-container {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .filter-label {
      margin-right: 10px;
      font-weight: bold;
      color: #2c3e50;
    }
    
    .filter-button {
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      color: #333;
      padding: 8px 15px;
      margin: 0 5px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .filter-button:hover {
      background-color: #e1e1e1;
    }
    
    .filter-button.active {
      background-color: #2c3e50;
      color: white;
      border-color: #2c3e50;
    }
    
    .data-info {
      text-align: center;
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-bottom: 15px;
    }
    
    .loading-error {
      color: #e74c3c;
      text-align: center;
      padding: 10px;
      background-color: rgba(231, 76, 60, 0.1);
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .loading-indicator {
      text-align: center;
      color: #3498db;
      margin-bottom: 15px;
    }
    
    .treemap-chart {
      width: 100%;
      height: 600px;
      margin: 0 auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .legend {
      margin-top: 20px;
      text-align: center;
    }
    
    .legend-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .legend-scale {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 3px;
    }
    
    .legend-label {
      font-size: 0.9rem;
    }
    
    /* Tooltip styles */
    .treemap-tooltip {
      position: absolute;
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 4px;
      pointer-events: none;
      font-size: 12px;
      z-index: 1000;
    }
    
    .treemap-tooltip .tooltip-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .treemap-tooltip .tooltip-value {
      margin-bottom: 3px;
    }
  `]
})
export class TreemapComponent implements OnInit, OnDestroy {
  @ViewChild('treemap', { static: true }) private treemapContainer!: ElementRef;
  
  private allPlays: FootballPlay[] = [];
  private treemapData: TreemapData = { name: 'Plays', children: [] };
  private dataFilteredSubscription: Subscription | null = null;
  
  selectedFilter: string = 'all';
  loading: boolean = true;
  error: string | null = null;
  dataSource: string | null = null;
  
  constructor(private yamlDataService: YamlDataService) {}
  
  ngOnInit() {
    this.loadYamlData();
    
    // Subscribe to data filtered events
    this.dataFilteredSubscription = this.yamlDataService.dataFiltered.subscribe(event => {
      console.log('Data filtered event received in treemap:', event);
      this.processFilteredData(event.filterType, event.data);
    });
  }
  
  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.dataFilteredSubscription) {
      this.dataFilteredSubscription.unsubscribe();
    }
  }
  
  /**
   * Load YAML data from the service
   */
  private loadYamlData() {
    this.loading = true;
    this.error = null;
    
    this.yamlDataService.loadFootballPlays()
      .subscribe({
        next: (result) => {
          if (result.data) {
            this.dataSource = result.filePath;
            this.allPlays = result.data;
            this.processData();
            this.loading = false;
          } else {
            this.error = 'Failed to parse YAML data.';
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error loading YAML file:', err);
          this.error = 'Failed to load YAML file.';
          this.loading = false;
        }
      });
  }
  
  /**
   * Process filtered data from the table component
   * @param filterType The type of filter applied
   * @param data The filtered data
   */
  private processFilteredData(filterType: string, data: FootballPlay[]) {
    if (data && data.length > 0) {
      this.allPlays = data;
      this.processData();
    }
  }
  
  /**
   * Filter the treemap data by play type
   * @param filter The filter to apply (all, run, pass)
   */
  filterData(filter: string) {
    this.selectedFilter = filter;
    this.processData();
  }
  
  /**
   * Process the data and create the treemap visualization
   */
  private processData() {
    if (!this.allPlays || this.allPlays.length === 0) {
      this.error = 'No data available to visualize.';
      return;
    }
    
    // Filter plays based on selected filter
    let filteredPlays = this.allPlays;
    if (this.selectedFilter === 'run') {
      filteredPlays = this.allPlays.filter(play => play.play_type.toLowerCase() === 'run');
    } else if (this.selectedFilter === 'pass') {
      filteredPlays = this.allPlays.filter(play => play.play_type.toLowerCase() === 'pass');
    }
    
    // Group plays by concept
    const conceptMap = new Map<string, { count: number, totalYards: number, playType: string }>();
    
    filteredPlays.forEach(play => {
      const concept = play.play_concept || 'Unknown';
      const yards = play.yards_gained || 0;
      const playType = play.play_type;
      
      if (!conceptMap.has(concept)) {
        conceptMap.set(concept, { count: 0, totalYards: 0, playType });
      }
      
      const conceptData = conceptMap.get(concept)!;
      conceptData.count += 1;
      conceptData.totalYards += yards;
    });
    
    // Convert map to treemap format
    const children: TreemapItem[] = [];
    
    conceptMap.forEach((data, concept) => {
      const avgYards = data.count > 0 ? data.totalYards / data.count : 0;
      
      children.push({
        name: concept,
        value: data.count,
        avgYards: parseFloat(avgYards.toFixed(1)),
        playType: data.playType
      });
    });
    
    // Sort by count (descending)
    children.sort((a, b) => b.value - a.value);
    
    // Update treemap data
    this.treemapData = {
      name: 'Plays',
      children: children
    };
    
    // Create treemap visualization
    this.createTreemap();
  }
  
  /**
   * Create the treemap visualization using D3.js
   */
  private createTreemap() {
    // Clear any existing chart
    d3.select(this.treemapContainer.nativeElement).selectAll('*').remove();
    
    if (this.treemapData.children.length === 0) {
      d3.select(this.treemapContainer.nativeElement)
        .append('div')
        .attr('class', 'no-data')
        .style('text-align', 'center')
        .style('padding', '40px')
        .style('color', '#7f8c8d')
        .text('No data available for the selected filter.');
      return;
    }
    
    // Set up dimensions
    const width = this.treemapContainer.nativeElement.clientWidth;
    const height = 600;
    
    // Create SVG
    const svg = d3.select(this.treemapContainer.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'treemap-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none');
    
    // Create hierarchical data
    const root = d3.hierarchy(this.treemapData)
      .sum(d => (d as any).value || 0) as TreemapNode;
    
    // Create treemap layout
    const treemapLayout = d3.treemap<any>()
      .size([width, height])
      .paddingOuter(3)
      .paddingInner(2);
    
    // Apply layout
    treemapLayout(root);
    
    // Color scale for yards gained (red to green)
    // Find min and max average yards
    const minAvgYards = d3.min(this.treemapData.children, d => d.avgYards) || -5;
    const maxAvgYards = d3.max(this.treemapData.children, d => d.avgYards) || 15;
    
    // Create color scale
    const colorScale = d3.scaleLinear<string>()
      .domain([minAvgYards, (minAvgYards + maxAvgYards) / 2, maxAvgYards])
      .range(['#e74c3c', '#f39c12', '#2ecc71']);
    
    // Create cells
    const cells = svg.selectAll('g')
      .data(root.leaves() as TreemapNode[])
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0 || 0},${d.y0 || 0})`);
    
    // Add rectangles
    cells.append('rect')
      .attr('width', d => (d.x1 || 0) - (d.x0 || 0))
      .attr('height', d => (d.y1 || 0) - (d.y0 || 0))
      .attr('fill', d => colorScale(d.data.avgYards || 0))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        tooltip.html(`
          <div class="tooltip-title">${d.data.name}</div>
          <div class="tooltip-value">Times Called: ${d.data.value || 0}</div>
          <div class="tooltip-value">Avg. Yards: ${d.data.avgYards || 0}</div>
          <div class="tooltip-value">Play Type: ${d.data.playType || 'Unknown'}</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Add text labels
    cells.append('text')
      .attr('x', 5)
      .attr('y', 15)
      .text(d => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)')
      .style('pointer-events', 'none');
    
    // Add count labels
    cells.append('text')
      .attr('x', 5)
      .attr('y', 30)
      .text(d => `${d.data.value}`)
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)')
      .style('pointer-events', 'none');
  }
}
