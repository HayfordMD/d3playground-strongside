import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YamlDataService, YamlDataResult } from '../services/yaml-data.service';
import { FootballPlay } from '../models/football-play.model';
import * as d3 from 'd3';

interface FormationData {
  formation: string;
  runCount: number;
  passCount: number;
  totalCount: number;
  avgYards: number;
}

interface ConceptData {
  concept: string;
  count: number;
  avgYards: number;
}

@Component({
  selector: 'app-formation-breakdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="formation-breakdown-container">
      <h2>Formation Breakdown Analysis</h2>
      
      <div class="filter-container">
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
        
        <div class="filter-group">
          <span class="filter-label">Distance:</span>
          <div class="slider-container">
            <span class="slider-value">{{ filters.minDistance }}</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              [(ngModel)]="filters.minDistance" 
              (ngModelChange)="updateDistanceFilter()">
            <span class="slider-value">{{ filters.maxDistance }}</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              [(ngModel)]="filters.maxDistance" 
              (ngModelChange)="updateDistanceFilter()">
          </div>
        </div>
        
        <div class="filter-group">
          <span class="filter-label">Quarter:</span>
          <button 
            class="filter-button" 
            [class.active]="qtrFilters[1]" 
            (click)="toggleQtrFilter(1)">1st</button>
          <button 
            class="filter-button" 
            [class.active]="qtrFilters[2]" 
            (click)="toggleQtrFilter(2)">2nd</button>
          <button 
            class="filter-button" 
            [class.active]="qtrFilters[3]" 
            (click)="toggleQtrFilter(3)">3rd</button>
          <button 
            class="filter-button" 
            [class.active]="qtrFilters[4]" 
            (click)="toggleQtrFilter(4)">4th</button>
        </div>
      </div>

      <div class="loading-message" *ngIf="loading">
        Loading data...
      </div>

      <div class="error-message" *ngIf="error">
        {{ error }}
      </div>

      <div class="view-container" *ngIf="!loading && !error">
        <!-- Main View: Formation Breakdown -->
        <div class="main-view" *ngIf="!selectedFormation">
          <h3>Formations by Play Type</h3>
          <div class="chart-container">
            <div #formationChart class="formation-chart"></div>
          </div>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color" style="background-color: #e74c3c;"></div>
              <span>Run Plays</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #9b59b6;"></div>
              <span>Pass Plays</span>
            </div>
          </div>
        </div>
        
        <!-- Detail View: Formation Concepts -->
        <div class="detail-view" *ngIf="selectedFormation">
          <div class="view-header">
            <h3>{{ selectedFormation }} Breakdown</h3>
            <button class="back-button" (click)="clearSelectedFormation()">← Back to All Formations</button>
          </div>
          
          <div class="filter-row">
            <button 
              class="concept-filter-button" 
              [class.active]="showTopConceptsOnly" 
              (click)="toggleTopConcepts()">
              Show Top 5 Concepts
            </button>
          </div>
          
          <div class="charts-container">
            <div class="pie-chart-container">
              <h4>Concepts by Count</h4>
              <div #conceptCountChart class="concept-chart"></div>
            </div>
            
            <div class="pie-chart-container">
              <h4>Average Yards by Concept</h4>
              <div #conceptYardsChart class="concept-chart"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .formation-breakdown-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2, h3, h4 {
      color: #2c3e50;
      margin-bottom: 15px;
      text-align: center;
    }

    .filter-container {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .filter-label {
      font-weight: bold;
      color: #2c3e50;
      min-width: 80px;
    }

    .filter-button {
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      color: #333;
      padding: 8px 15px;
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

    .slider-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .slider-value {
      min-width: 20px;
      text-align: center;
    }

    .view-container {
      margin-top: 20px;
    }

    .chart-container {
      height: 500px;
      width: 100%;
      margin: 0 auto;
    }

    .formation-chart {
      width: 100%;
      height: 100%;
    }

    .legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .legend-color {
      width: 15px;
      height: 15px;
      border-radius: 3px;
    }

    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .back-button {
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      color: #333;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .back-button:hover {
      background-color: #1a252f;
    }
    
    .filter-row {
      display: flex;
      justify-content: center;
      margin-bottom: 15px;
    }
    
    .concept-filter-button {
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      color: #333;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .concept-filter-button:hover {
      background-color: #e1e1e1;
    }
    
    .concept-filter-button.active {
      background-color: #2c3e50;
      color: white;
      border-color: #2c3e50;
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .pie-chart-container {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .concept-chart {
      height: 300px;
      width: 100%;
    }

    .loading-message, .error-message {
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
export class FormationBreakdownComponent implements OnInit, AfterViewInit {
  @ViewChild('formationChart') private formationChartRef!: ElementRef;
  @ViewChild('conceptCountChart') private conceptCountChartRef!: ElementRef;
  @ViewChild('conceptYardsChart') private conceptYardsChartRef!: ElementRef;

  // Data
  allPlays: FootballPlay[] = [];
  filteredPlays: FootballPlay[] = [];
  formationData: FormationData[] = [];
  
  // Filters
  filters: {
    down: string;
    minDistance: number;
    maxDistance: number;
  } = {
    down: 'all',
    minDistance: 1,
    maxDistance: 20
  };
  
  qtrFilters: { [key: number]: boolean } = {
    1: true,
    2: true,
    3: true,
    4: true
  };
  
  // Component state
  loading: boolean = true;
  error: string | null = null;
  selectedFormation: string | null = null;
  showTopConceptsOnly: boolean = true; // Default to showing only top 5 concepts

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
          this.processFormationData();
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
    // Update the filter based on type
    if (filterType === 'down') {
      this.filters.down = value;
    } else if (filterType === 'minDistance' || filterType === 'maxDistance') {
      // Convert string to number for distance values
      this.filters[filterType] = parseInt(value);
    }
    
    // Apply filters and update charts
    this.applyFilters();
    this.processFormationData();
    this.updateCharts();
  }

  updateDistanceFilter(): void {
    // Make sure min is not greater than max
    if (this.filters.minDistance > this.filters.maxDistance) {
      this.filters.maxDistance = this.filters.minDistance;
    }
    
    // Apply filters and update charts
    this.applyFilters();
    this.processFormationData();
    this.updateCharts();
  }

  toggleQtrFilter(qtr: number): void {
    this.qtrFilters[qtr] = !this.qtrFilters[qtr];
    
    // Apply filters and update charts
    this.applyFilters();
    this.processFormationData();
    this.updateCharts();
  }

  applyFilters(): void {
    // Start with all plays
    let filtered = [...this.allPlays];
    
    // Apply down filter
    if (this.filters.down !== 'all') {
      const downNumber = parseInt(this.filters.down);
      filtered = filtered.filter(play => play.down === downNumber);
    }
    
    // Apply distance filter
    filtered = filtered.filter(play => 
      play.distance >= this.filters.minDistance && 
      play.distance <= this.filters.maxDistance
    );
    
    // Apply quarter filter
    const activeQtrs = Object.entries(this.qtrFilters)
      .filter(([_, active]) => active)
      .map(([qtr, _]) => parseInt(qtr));
    
    if (activeQtrs.length < 4) { // Only filter if not all quarters are selected
      filtered = filtered.filter(play => 
        play.qtr !== undefined && activeQtrs.includes(play.qtr)
      );
    }
    
    // Store filtered plays
    this.filteredPlays = filtered;
  }

  processFormationData(): void {
    // Group plays by formation
    const formationMap = new Map<string, {
      runCount: number;
      passCount: number;
      totalYards: number;
      totalCount: number;
    }>();
    
    this.filteredPlays.forEach(play => {
      const formation = play.play_formation;
      
      if (!formationMap.has(formation)) {
        formationMap.set(formation, {
          runCount: 0,
          passCount: 0,
          totalYards: 0,
          totalCount: 0
        });
      }
      
      const data = formationMap.get(formation)!;
      
      // Increment run or pass count
      if (play.play_type.toLowerCase() === 'run') {
        data.runCount++;
      } else if (play.play_type.toLowerCase() === 'pass') {
        data.passCount++;
      }
      
      // Add yards and increment total count
      data.totalYards += play.yards_gained;
      data.totalCount++;
    });
    
    // Convert map to array and calculate average yards
    this.formationData = Array.from(formationMap.entries())
      .map(([formation, data]) => ({
        formation,
        runCount: data.runCount,
        passCount: data.passCount,
        totalCount: data.totalCount,
        avgYards: data.totalYards / data.totalCount
      }))
      .sort((a, b) => b.totalCount - a.totalCount); // Sort by total count descending
  }

  initCharts(): void {
    if (!this.filteredPlays.length) return;
    
    setTimeout(() => {
      this.createFormationChart();
    }, 0);
  }

  updateCharts(): void {
    // Clear existing charts
    if (this.formationChartRef) {
      d3.select(this.formationChartRef.nativeElement).selectAll('*').remove();
    }
    
    if (this.selectedFormation) {
      if (this.conceptCountChartRef) {
        d3.select(this.conceptCountChartRef.nativeElement).selectAll('*').remove();
      }
      if (this.conceptYardsChartRef) {
        d3.select(this.conceptYardsChartRef.nativeElement).selectAll('*').remove();
      }
    }
    
    // Recreate charts with filtered data
    this.initCharts();
    
    // If a formation is selected, create the concept charts
    if (this.selectedFormation) {
      this.createConceptCharts();
    }
  }

  createFormationChart(): void {
    if (!this.formationChartRef || !this.formationData.length) return;
    
    const element = this.formationChartRef.nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const margin = { top: 20, right: 30, bottom: 40, left: 200 }; // Increased left margin for formation names
    
    // Take top 15 formations for readability
    const topFormations = this.formationData.slice(0, 15);
    
    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const y = d3.scaleBand()
      .domain(topFormations.map(d => d.formation))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.3);
    
    const x = d3.scaleLinear()
      .domain([0, d3.max(topFormations, d => d.runCount + d.passCount) || 0])
      .nice()
      .range([0, width - margin.left - margin.right]);
    
    // Create axes
    const yAxis = svg.append('g')
      .call(d3.axisLeft(y));
      
    // Make formation labels clickable
    yAxis.selectAll('.tick text')
      .style('cursor', 'pointer')
      .style('fill', (d: any) => this.selectedFormation === d ? '#3498db' : '#000')
      .style('font-weight', (d: any) => this.selectedFormation === d ? 'bold' : 'normal')
      .on('click', (event: any, d: any) => {
        this.selectFormation(d);
      })
      .on('mouseover', function() {
        d3.select(this).style('text-decoration', 'underline');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).style('text-decoration', 'none');
      });
    
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));
    
    // Create stacked data
    const stackedData = topFormations.map(d => [
      { formation: d.formation, type: 'run', count: d.runCount, x0: 0, x1: d.runCount },
      { formation: d.formation, type: 'pass', count: d.passCount, x0: d.runCount, x1: d.runCount + d.passCount }
    ]);
    
    // Create color scale
    const color = d3.scaleOrdinal<string>()
      .domain(['run', 'pass'])
      .range(['#e74c3c', '#9b59b6']);
    
    // Create stacked bars
    const formationGroups = svg.selectAll('.formation-group')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'formation-group')
      .attr('transform', d => `translate(0,${y(d[0].formation)})`);
    
    formationGroups.selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => x(d.x0))
      .attr('y', 0)
      .attr('width', d => x(d.x1) - x(d.x0))
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.type))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        this.selectFormation(d.formation);
      })
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
      });
    
    // Add count labels
    formationGroups.selectAll('.count-label')
      .data(d => d.filter(item => item.count > 0)) // Only add labels for non-zero counts
      .enter()
      .append('text')
      .attr('class', 'count-label')
      .attr('x', d => x(d.x0) + (x(d.x1) - x(d.x0)) / 2)
      .attr('y', y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text(d => d.count);
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', -5)
      .attr('font-weight', 'bold')
      .text('Formation Play Type Distribution');
  }

  selectFormation(formation: string): void {
    this.selectedFormation = formation;
    setTimeout(() => {
      this.createConceptCharts();
    }, 0);
  }

  clearSelectedFormation(): void {
    this.selectedFormation = null;
    this.updateCharts();
  }

  toggleTopConcepts(): void {
    this.showTopConceptsOnly = !this.showTopConceptsOnly;
    if (this.selectedFormation) {
      // Clear existing charts
      if (this.conceptCountChartRef) {
        d3.select(this.conceptCountChartRef.nativeElement).selectAll('*').remove();
      }
      if (this.conceptYardsChartRef) {
        d3.select(this.conceptYardsChartRef.nativeElement).selectAll('*').remove();
      }
      // Recreate the concept charts with the new filter setting
      this.createConceptCharts();
    }
  }

  createConceptCharts(): void {
    if (!this.selectedFormation) return;
    
    // Filter plays for the selected formation
    const formationPlays = this.filteredPlays.filter(
      play => play.play_formation === this.selectedFormation
    );
    
    // Create run/pass pie chart first
    this.createRunPassPieChart(formationPlays);
    
    // Process concept data
    const conceptData = this.getConceptData(formationPlays);
    
    // Create the concept charts
    this.createConceptCountChart(conceptData);
    this.createConceptYardsChart(conceptData);
  }

  getConceptData(plays: FootballPlay[]): ConceptData[] {
    const conceptMap = new Map<string, { count: number, totalYards: number }>();
    
    plays.forEach(play => {
      const concept = play.play_concept;
      
      if (!conceptMap.has(concept)) {
        conceptMap.set(concept, { count: 0, totalYards: 0 });
      }
      
      const data = conceptMap.get(concept)!;
      data.count++;
      data.totalYards += play.yards_gained;
    });
    
    return Array.from(conceptMap.entries())
      .map(([concept, data]) => ({
        concept,
        count: data.count,
        avgYards: data.totalYards / data.count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }
  createRunPassPieChart(plays: FootballPlay[]): void {
    // Clear any existing pie chart
    const container = d3.select('#runPassPieChart');
    container.selectAll('*').remove();
    
    if (!plays.length) return;
    
    // Count runs and passes
    const runCount = plays.filter(play => play.play_type.toLowerCase() === 'run').length;
    const passCount = plays.filter(play => play.play_type.toLowerCase() === 'pass').length;
    
    const data = [
      { type: 'Run', count: runCount },
      { type: 'Pass', count: passCount }
    ];
    
    // Create pie chart
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    
    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -radius - 10)
      .attr('font-weight', 'bold')
      .text(`${this.selectedFormation} - Run/Pass Breakdown`);
    
    // Create color scale
    const color = d3.scaleOrdinal<string>()
      .domain(['Run', 'Pass'])
      .range(['#e74c3c', '#9b59b6']);
    
    // Create pie layout
    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);
    
    // Create arc generator
    const arc = d3.arc<any, d3.PieArcDatum<any>>()
      .innerRadius(0)
      .outerRadius(radius * 0.8);
    
    // Create outer arc for labels
    const outerArc = d3.arc<any, d3.PieArcDatum<any>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);
    
    // Create pie slices
    const arcs = svg.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    // Add slices
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.type))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
      });
    
    // Add labels
    arcs.append('text')
      .attr('transform', (d: d3.PieArcDatum<any>) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(d => `${d.data.type}: ${d.data.count}`);
    
    // Add percentage labels
    arcs.append('text')
      .attr('transform', (d: d3.PieArcDatum<any>) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .text(d => `${Math.round((d.data.count / plays.length) * 100)}%`);
  }
  
  createConceptCountChart(conceptData: ConceptData[]): void {
    if (!this.conceptCountChartRef || !conceptData.length) return;
    
    const element = this.conceptCountChartRef.nativeElement;
    const width = element.clientWidth || 300;
    const height = element.clientHeight || 300;
    const radius = Math.min(width, height) / 2;
    
    // Filter to top 5 concepts if the filter is enabled
    let filteredConceptData = [...conceptData];
    if (this.showTopConceptsOnly) {
      filteredConceptData = conceptData
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
    
    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -radius - 10)
      .attr('font-weight', 'bold')
      .text(`${this.selectedFormation} - Concepts by Count${this.showTopConceptsOnly ? ' (Top 5)' : ''}`);
    
    // Create color scale
    const color = d3.scaleOrdinal<string>()
      .domain(filteredConceptData.map(d => d.concept))
      .range(d3.schemeCategory10);
    
    // Create pie layout
    const pie = d3.pie<ConceptData>()
      .value(d => d.count)
      .sort((a, b) => b.count - a.count); // Sort by count descending
      
    // Create arc generator
    const arc = d3.arc<any, d3.PieArcDatum<ConceptData>>()
      .innerRadius(0)
      .outerRadius(radius * 0.8);
    
    // Create pie slices
    const arcs = svg.selectAll('.arc')
      .data(pie(filteredConceptData))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    // Add slices
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.concept))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
      });
    
    // Add labels
    arcs.append('text')
      .attr('transform', (d: d3.PieArcDatum<ConceptData>) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text(d => d.data.count > 3 ? d.data.concept : ''); // Only show label if count > 3
      
    // Add count labels
    arcs.append('text')
      .attr('transform', (d: d3.PieArcDatum<ConceptData>) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('fill', 'white')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .text(d => d.data.count > 1 ? `(${d.data.count})` : '');
  }
  
  createConceptYardsChart(conceptData: ConceptData[]): void {
    if (!this.conceptYardsChartRef || !conceptData.length) return;
    
    const element = this.conceptYardsChartRef.nativeElement;
    const width = element.clientWidth || 300;
    const height = element.clientHeight || 300;
    const radius = Math.min(width, height) / 2;
    
    // Filter to top 5 concepts if the filter is enabled
    let filteredConceptData = [...conceptData];
    if (this.showTopConceptsOnly) {
      filteredConceptData = conceptData
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
    
    // Create SVG
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Add title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -radius - 10)
      .attr('font-weight', 'bold')
      .text(`${this.selectedFormation} - Average Yards by Concept${this.showTopConceptsOnly ? ' (Top 5)' : ''}`);
    
    // Create color scale based on yards gained
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([-5, 10]); // Red for negative yards, green for positive
    
    // Create pie layout
    const pie = d3.pie<ConceptData>()
      .value(d => d.count) // Size of slice based on count
      .sort((a, b) => b.avgYards - a.avgYards); // Sort by avg yards descending
      
    // Create arc generator
    const arc = d3.arc<any, d3.PieArcDatum<ConceptData>>()
      .innerRadius(0)
      .outerRadius(radius * 0.8);
    
    // Create pie slices
    const arcs = svg.selectAll('.arc')
      .data(pie(filteredConceptData))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    // Add slices
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.avgYards))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
      });
      
    // Add labels
    arcs.append('text')
      .attr('transform', (d: d3.PieArcDatum<ConceptData>) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text(d => d.data.count > 3 ? d.data.concept : ''); // Only show label if count > 3
      
    // Add yards labels
    arcs.append('text')
      .attr('transform', (d: d3.PieArcDatum<ConceptData>) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('fill', 'white')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .text(d => d.data.count > 3 ? `${d.data.avgYards.toFixed(1)}` : ''); // Only show label if count > 3
  }
}
