import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YamlDataService, YamlDataResult } from '../yaml-data.service';
import { FootballPlay } from '../../models/football-play.model';
import * as d3 from 'd3';

@Component({
  selector: 'app-play-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="play-analysis-container">
      <h2>Analysis Dashboard</h2>
      <div class="filter-container">
        <div class="filter-group">
          <span class="filter-label">Play Type:</span>
          <button 
            class="filter-button" 
            [class.active]="filters.playType === 'all'" 
            (click)="updateFilter('playType', 'all')">All</button>
          <button 
            class="filter-button" 
            [class.active]="filters.playType === 'run'" 
            (click)="updateFilter('playType', 'run')">Run</button>
          <button 
            class="filter-button" 
            [class.active]="filters.playType === 'pass'" 
            (click)="updateFilter('playType', 'pass')">Pass</button>
        </div>
        
        <div class="filter-group">
          <span class="filter-label">Down:</span>
          <button 
            class="filter-button" 
            [class.active]="filters.down === 'all'" 
            (click)="updateFilter('down', 'all')">All</button>
          <button 
            class="filter-button" 
            [class.active]="filters.down === '1'" 
            (click)="updateFilter('down', '1')">1st</button>
          <button 
            class="filter-button" 
            [class.active]="filters.down === '2'" 
            (click)="updateFilter('down', '2')">2nd</button>
          <button 
            class="filter-button" 
            [class.active]="filters.down === '3'" 
            (click)="updateFilter('down', '3')">3rd</button>
          <button 
            class="filter-button" 
            [class.active]="filters.down === '4'" 
            (click)="updateFilter('down', '4')">4th</button>
        </div>
      </div>

      <div class="loading-message" *ngIf="loading">
        Loading data...
      </div>

      <div class="error-message" *ngIf="error">
        {{ error }}
      </div>

      <div class="dashboard-container" *ngIf="!loading && !error">
        <div class="chart-container">
          <h3>Play Concept Success Rate</h3>
          <div class="chart-wrapper">
            <div #conceptSuccessChart class="concept-success-chart"></div>
          </div>
        </div>
        
        <div class="chart-container">
          <h3>Yards Gained by Down</h3>
          <div class="chart-wrapper">
            <div #yardsGainedChart class="yards-gained-chart"></div>
          </div>
        </div>
        
        <div class="chart-container">
          <h3>Formation Effectiveness</h3>
          <div class="chart-wrapper">
            <div #formationChart class="formation-chart"></div>
          </div>
        </div>
        
        <div class="stats-container">
          <h3>Key Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ avgYardsGained | number:'1.1-1' }}</div>
              <div class="stat-label">Avg. Yards/Play</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ successRate | percent }}</div>
              <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ bigPlayRate | percent }}</div>
              <div class="stat-label">Big Play Rate (10+ yds)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ negativePlayRate | percent }}</div>
              <div class="stat-label">Negative Play Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .play-analysis-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2, h3 {
      color: #2c3e50;
      margin-bottom: 10px;
      text-align: center;
    }

    .file-path-info {
      text-align: center;
      margin-bottom: 20px;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .file-path-info code {
      background-color: #f0f0f0;
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
    }

    .filter-container {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .filter-group {
      display: flex;
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

    .dashboard-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .chart-container {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .chart-wrapper {
      height: 300px;
      width: 100%;
    }

    .concept-success-chart, .yards-gained-chart, .formation-chart {
      width: 100%;
      height: 100%;
    }

    .stats-container {
      grid-column: 1 / -1;
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .stat-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-top: 5px;
    }

    .loading-message, .error-message, .no-data-message {
      text-align: center;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      margin-top: 20px;
    }

    .error-message {
      color: #e74c3c;
    }
  `
})
export class PlayAnalysisComponent implements OnInit, AfterViewInit {
  @ViewChild('conceptSuccessChart') private conceptSuccessChartRef!: ElementRef;
  @ViewChild('yardsGainedChart') private yardsGainedChartRef!: ElementRef;
  @ViewChild('formationChart') private formationChartRef!: ElementRef;

  // Data
  allPlays: FootballPlay[] = [];
  filteredPlays: FootballPlay[] = [];
  
  // Filters
  filters = {
    playType: 'all',
    down: 'all',
    formation: 'all',
    concept: 'all'
  };
  
  // Stats
  avgYardsGained: number = 0;
  successRate: number = 0;
  bigPlayRate: number = 0;
  negativePlayRate: number = 0;
  
  // Component state
  loading: boolean = true;
  error: string | null = null;

  constructor(private yamlDataService: YamlDataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    
    this.yamlDataService.loadFootballPlays().subscribe({
      next: (result: YamlDataResult<FootballPlay[]>) => {
        if (result.data) {
          this.allPlays = result.data;
          this.applyFilters();
          this.calculateStats();
          this.initCharts();
          this.loading = false;
        } else {
          this.error = 'Failed to load play data';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading play data:', err);
        this.error = 'Error loading play data. Please try again later.';
        this.loading = false;
      }
    });
  }

  updateFilter(filterType: string, value: string): void {
    // Update the filter
    this.filters[filterType as keyof typeof this.filters] = value;
    
    // Apply filters and update charts
    this.applyFilters();
    this.calculateStats();
    this.updateCharts();
  }

  applyFilters(): void {
    // Start with all plays
    let filtered = [...this.allPlays];
    
    // Apply play type filter
    if (this.filters.playType !== 'all') {
      filtered = filtered.filter(play => 
        play.play_type.toLowerCase() === this.filters.playType.toLowerCase()
      );
    }
    
    // Apply down filter
    if (this.filters.down !== 'all') {
      const downNumber = parseInt(this.filters.down);
      filtered = filtered.filter(play => play.down === downNumber);
    }
    
    // Store filtered plays
    this.filteredPlays = filtered;
  }

  calculateStats(): void {
    if (this.filteredPlays.length === 0) {
      this.avgYardsGained = 0;
      this.successRate = 0;
      this.bigPlayRate = 0;
      this.negativePlayRate = 0;
      return;
    }
    
    // Calculate average yards gained
    const totalYards = this.filteredPlays.reduce((sum, play) => sum + play.yards_gained, 0);
    this.avgYardsGained = totalYards / this.filteredPlays.length;
    
    // Calculate success rate (positive yards)
    const successfulPlays = this.filteredPlays.filter(play => play.yards_gained > 0);
    this.successRate = successfulPlays.length / this.filteredPlays.length;
    
    // Calculate big play rate (10+ yards)
    const bigPlays = this.filteredPlays.filter(play => play.yards_gained >= 10);
    this.bigPlayRate = bigPlays.length / this.filteredPlays.length;
    
    // Calculate negative play rate
    const negativePlays = this.filteredPlays.filter(play => play.yards_gained < 0);
    this.negativePlayRate = negativePlays.length / this.filteredPlays.length;
  }

  initCharts(): void {
    if (!this.filteredPlays.length) return;
    
    setTimeout(() => {
      this.createConceptSuccessChart();
      this.createYardsGainedChart();
      this.createFormationChart();
    }, 0);
  }

  updateCharts(): void {
    // Clear existing charts
    d3.select(this.conceptSuccessChartRef.nativeElement).selectAll('*').remove();
    d3.select(this.yardsGainedChartRef.nativeElement).selectAll('*').remove();
    d3.select(this.formationChartRef.nativeElement).selectAll('*').remove();
    
    // Recreate charts with filtered data
    this.initCharts();
  }

  createConceptSuccessChart(): void {
    if (!this.conceptSuccessChartRef) return;
    
    const element = this.conceptSuccessChartRef.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    
    // Group plays by concept and calculate average yards
    const conceptData = this.getConceptData();
    
    // Sort by average yards
    conceptData.sort((a, b) => b.avgYards - a.avgYards);
    
    // Take top 10 concepts for readability
    const topConcepts = conceptData.slice(0, 10);
    
    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleBand()
      .domain(topConcepts.map(d => d.concept))
      .range([0, width - margin.left - margin.right])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(topConcepts, d => d.avgYards) || 0])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);
    
    // Create color scale
    const colorScale = d3.scaleLinear<string>()
      .domain([-5, 0, 5, 10])
      .range(['#e74c3c', '#f39c12', '#2ecc71', '#27ae60'])
      .clamp(true);
    
    // Create bars
    svg.selectAll('.bar')
      .data(topConcepts)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.concept) || 0)
      .attr('y', d => y(Math.max(0, d.avgYards)))
      .attr('width', x.bandwidth())
      .attr('height', d => Math.abs(y(d.avgYards) - y(0)))
      .attr('fill', d => colorScale(d.avgYards));
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add labels
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', height - margin.top - margin.bottom + 50)
      .text('Play Concept');
    
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .text('Average Yards Gained');
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', -5)
      .attr('font-weight', 'bold')
      .text('Top 10 Play Concepts by Average Yards');
  }

  createYardsGainedChart(): void {
    if (!this.yardsGainedChartRef) return;
    
    const element = this.yardsGainedChartRef.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    
    // Group plays by down and calculate average yards
    const downData = this.getDownData();
    
    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleBand()
      .domain(downData.map(d => `${d.down}${this.getOrdinalSuffix(d.down)}`))
      .range([0, width - margin.left - margin.right])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(downData, d => d.avgYards) || 0])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['1', '2', '3', '4'])
      .range(['#3498db', '#2ecc71', '#f39c12', '#e74c3c']);
    
    // Create bars
    svg.selectAll('.bar')
      .data(downData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(`${d.down}${this.getOrdinalSuffix(d.down)}`) || 0)
      .attr('y', d => y(d.avgYards))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.top - margin.bottom - y(d.avgYards))
      .attr('fill', d => colorScale(d.down.toString()));
    
    // Add data labels
    svg.selectAll('.label')
      .data(downData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (x(`${d.down}${this.getOrdinalSuffix(d.down)}`) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.avgYards) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.avgYards.toFixed(1));
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add labels
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', height - margin.top - margin.bottom + 40)
      .text('Down');
    
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .text('Average Yards Gained');
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', -5)
      .attr('font-weight', 'bold')
      .text('Average Yards Gained by Down');
  }

  createFormationChart(): void {
    if (!this.formationChartRef) return;
    
    const element = this.formationChartRef.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Group plays by formation
    const formationData = this.getFormationData();
    
    // Take top formations for readability (those with at least 3 plays)
    const topFormations = formationData
      .filter(d => d.count >= 3)
      .sort((a, b) => b.count - a.count);
    
    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Create color scale
    const color = d3.scaleOrdinal<string>()
      .domain(topFormations.map(d => d.formation))
      .range(d3.schemeCategory10);
    
    // Create pie chart
    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);
    
    const arc = d3.arc<any>()
      .innerRadius(radius * 0.4) // Create a donut chart
      .outerRadius(radius);
    
    // Add tooltip
    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none');
    
    // Create arcs
    const arcs = svg.selectAll('.arc')
      .data(pie(topFormations))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.formation))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', `scale(1.05)`);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        
        tooltip.html(`
          <strong>${d.data.formation}</strong><br>
          Plays: ${d.data.count}<br>
          Avg Yards: ${d.data.avgYards.toFixed(1)}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', `scale(1)`);
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -radius - 20)
      .attr('font-weight', 'bold')
      .text('Play Distribution by Formation');
    
    // Add legend
    const legend = svg.selectAll('.legend')
      .data(topFormations.slice(0, 5)) // Show top 5 formations in legend
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${radius + 20}, ${-radius + i * 20})`);
    
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => color(d.formation));
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text(d => d.formation);
  }

  // Helper methods for data transformation
  getConceptData() {
    const conceptMap = new Map<string, { totalYards: number, count: number }>();
    
    this.filteredPlays.forEach(play => {
      const concept = play.play_concept;
      if (!conceptMap.has(concept)) {
        conceptMap.set(concept, { totalYards: 0, count: 0 });
      }
      
      const data = conceptMap.get(concept)!;
      data.totalYards += play.yards_gained;
      data.count += 1;
    });
    
    return Array.from(conceptMap.entries()).map(([concept, data]) => ({
      concept,
      avgYards: data.totalYards / data.count,
      count: data.count
    }));
  }

  getDownData() {
    const downMap = new Map<number, { totalYards: number, count: number }>();
    
    // Initialize for all downs
    for (let i = 1; i <= 4; i++) {
      downMap.set(i, { totalYards: 0, count: 0 });
    }
    
    this.filteredPlays.forEach(play => {
      const down = play.down;
      const data = downMap.get(down)!;
      data.totalYards += play.yards_gained;
      data.count += 1;
    });
    
    return Array.from(downMap.entries())
      .filter(([_, data]) => data.count > 0) // Only include downs with plays
      .map(([down, data]) => ({
        down,
        avgYards: data.totalYards / data.count,
        count: data.count
      }));
  }

  getFormationData() {
    const formationMap = new Map<string, { totalYards: number, count: number }>();
    
    this.filteredPlays.forEach(play => {
      const formation = play.play_formation;
      if (!formationMap.has(formation)) {
        formationMap.set(formation, { totalYards: 0, count: 0 });
      }
      
      const data = formationMap.get(formation)!;
      data.totalYards += play.yards_gained;
      data.count += 1;
    });
    
    return Array.from(formationMap.entries()).map(([formation, data]) => ({
      formation,
      avgYards: data.totalYards / data.count,
      count: data.count
    }));
  }

  // Helper for ordinal suffixes (1st, 2nd, 3rd, 4th)
  getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  }
}
