import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { YamlDataService } from '../services/yaml-data.service';
import { FootballPlay } from '../models/football-play.model';
import { CommonModule } from '@angular/common';
import { PlayModalService } from '../services/play-modal.service';
import { PlayModalComponent } from '../shared/play-modal/play-modal.component';

interface OffensePlay {
  playID: number;
  playname: string; // concept
  yardsGained: number;
  Down: number;
  Distance: number;
  Result: string;
  Efficient: boolean;
  VideoID?: string;
  GameID?: string;
  // Add actual play name and formation from YAML
  actualPlayName: string;
  actualFormation: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PlayModalComponent],
  template: `
    <h1>Offensive Breakdown Analysis</h1>
    <div class="pie-chart-container">
      <div class="chart-header">
        <h2>{{ chartTitle }}</h2>
        <button *ngIf="chartMode !== 'main'" class="back-button" (click)="returnToMainView()">← Back to Run/Pass</button>
      </div>
      <div class="filter-container">
        <span class="filter-label">Filter by Down:</span>
        <button class="filter-button" [class.active]="selectedDown === 0" (click)="filterByDown(0)">All</button>
        <button class="filter-button" [class.active]="selectedDown === 1" (click)="filterByDown(1)">1st</button>
        <button class="filter-button" [class.active]="selectedDown === 2" (click)="filterByDown(2)">2nd</button>
        <button class="filter-button" [class.active]="selectedDown === 3" (click)="filterByDown(3)">3rd</button>
        <button class="filter-button" [class.active]="selectedDown === 4" (click)="filterByDown(4)">4th</button>
      </div>
      <div #pieChart></div>
      <div #conceptTable class="concept-table-container"></div>
    </div>
  `,
  styles: [`
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .back-button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      transition: background-color 0.2s;
    }
    
    .back-button:hover {
      background-color: #2980b9;
    }
    
    .no-data-message {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
      font-size: 16px;
      font-style: italic;
    }
    
    .play-name {
      color: #3498db;
      text-decoration: underline;
      cursor: pointer;
    }
    
    .play-name:hover {
      color: #2980b9;
    }
    
    .positive-yards {
      color: #27ae60;
      font-weight: bold;
    }
    
    .negative-yards {
      color: #e74c3c;
      font-weight: bold;
    }
    
    .neutral-yards {
      color: #7f8c8d;
    }
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
    .navigation-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    .yaml-button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .yaml-button:hover {
      background-color: #2980b9;
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
    .filter-container {
      margin-bottom: 15px;
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
      padding: 5px 10px;
      margin: 0 3px;
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
    .concept-table-container {
      margin-top: 20px;
      width: 100%;
    }
    
    .table-container {
      margin-top: 15px;
      width: 100%;
      overflow-x: auto;
    }
    
    .table-title {
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .concept-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .concept-table th, .concept-table td {
      padding: 10px 15px;
      text-align: left;
      border-bottom: 1px solid #e1e1e1;
    }
    
    .concept-table th {
      background-color: #2c3e50;
      color: white;
      font-weight: 600;
      position: relative;
      cursor: pointer;
    }
    
    .concept-table th:hover {
      background-color: #34495e;
    }
    
    .concept-table th.sortable {
      cursor: pointer;
      user-select: none;
    }
    
    .concept-table th.sort-asc::after {
      content: ' ▲';
      font-size: 0.8em;
      opacity: 0.8;
    }
    
    .concept-table th.sort-desc::after {
      content: ' ▼';
      font-size: 0.8em;
      opacity: 0.8;
    }
    
    .concept-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .concept-table tr:hover {
      background-color: #f1f1f1;
    }
    .config-button-container {
      margin-top: 30px;
    }
    .config-button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      transition: background-color 0.3s;
    }
    .config-button:hover {
      background-color: #2980b9;
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('pieChart', { static: true }) private pieChartContainer!: ElementRef;
  @ViewChild('conceptTable', { static: true }) private conceptTableContainer!: ElementRef;
  
  private conceptCounts: Map<string, Map<string, number>> = new Map();
  private filteredConceptCounts: Map<string, Map<string, number>> = new Map();
  private allPlays: Map<string, OffensePlay[]> = new Map();
  selectedDown: number = 0; // 0 means all downs
  loading: boolean = true;
  error: string | null = null;
  yamlFilePath: string = 'assets/data/betterrunpass.yaml';
  private activeCategory: string | null = null; // Track the currently active category
  chartMode: 'main' | 'run' | 'pass' = 'main'; // Track the current chart mode
  chartTitle: string = 'Run vs Pass Distribution'; // Dynamic chart title
  private dataFilteredSubscription: Subscription | null = null;

  constructor(private router: Router, private yamlDataService: YamlDataService, private playModalService: PlayModalService) {}

  ngOnInit() {
    this.loadYamlData();
    
    // Subscribe to data filtered events
    this.dataFilteredSubscription = this.yamlDataService.dataFiltered.subscribe(event => {
      console.log('Data filtered event received:', event);
      // Update the pie chart when data is filtered in the table component
      this.processFilteredData(event.filterType, event.data);
    });
  }
  
  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.dataFilteredSubscription) {
      this.dataFilteredSubscription.unsubscribe();
    }
  }

  filterByDown(down: number) {
    this.selectedDown = down;
    
    // Update the appropriate chart based on current mode
    if (this.chartMode === 'main') {
      this.createRunPassPieChart();
    } else if (this.chartMode === 'run') {
      this.createConceptPieChart('Run');
    } else if (this.chartMode === 'pass') {
      this.createConceptPieChart('Pass');
    }
    
    // If a category was previously selected, update the concept table for that category
    if (this.activeCategory) {
      this.showConceptTable(this.activeCategory);
    }
  }
  
  // Return to the main Run/Pass view
  returnToMainView() {
    this.chartMode = 'main';
    this.chartTitle = 'Run vs Pass Distribution';
    this.activeCategory = null;
    this.createRunPassPieChart();
    // Clear the concept table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
  }

  navigateToYamlTable(): void {
    this.router.navigate(['/yaml-data']);
  }

  private loadYamlData() {
    this.loading = true;
    this.error = null;
    
    this.yamlDataService.loadFootballPlays()
      .subscribe({
        next: (result) => {
          if (result.data) {
            this.yamlFilePath = result.filePath;
            this.processYamlData(result.data);
            this.createRunPassPieChart();
            this.loading = false;
          } else {
            this.error = 'Failed to parse YAML data. Using mock data instead.';
            this.loading = false;
            this.createMockConceptData();
            this.createRunPassPieChart();
          }
        },
        error: (err) => {
          console.error('Error loading YAML file:', err);
          this.error = 'Failed to load YAML file. Using mock data instead.';
          this.loading = false;
          this.createMockConceptData();
          this.createRunPassPieChart();
        }
      });
  }

  /**
   * Process filtered data from the table component
   * @param filterType The type of filter applied
   * @param data The filtered data
   */
  private processFilteredData(filterType: string, data: FootballPlay[]) {
    // Process the filtered data without clearing existing data
    if (data && data.length > 0) {
      // Update the pie chart with the filtered data
      this.processYamlData(data, false);
      this.createRunPassPieChart();
    }
  }

  /**
   * Process YAML data and organize it for visualization
   * @param data The football play data to process
   * @param clearExisting Whether to clear existing data (default: true)
   */
  private processYamlData(data: FootballPlay[], clearExisting: boolean = true) {
    // Clear existing data if specified
    if (clearExisting) {
      this.conceptCounts.clear();
      this.allPlays.clear();
    } else {
      // If not clearing, we'll rebuild the data from scratch based on the filtered data
      this.conceptCounts.clear();
      this.allPlays.clear();
    }
    
    // Initialize concept maps
    const runConcepts = new Map<string, number>();
    const passConcepts = new Map<string, number>();
    
    // Initialize play arrays
    const runPlays: OffensePlay[] = [];
    const passPlays: OffensePlay[] = [];
    
    // Process each entry in the YAML data
    data.forEach(play => {
      const playType = play.play_type.toLowerCase();
      const concept = play.play_concept || 'Unknown';
      const yardsGained = play.yards_gained || 0;
      
      // Create play object for our visualization
      const offensePlay: OffensePlay = {
        playID: parseInt(play.play_id.split('-')[0] || '0'),
        playname: concept,
        yardsGained: yardsGained,
        Down: play.down || 1,
        Distance: play.distance || 10,
        Result: yardsGained > 0 ? 'positive' : yardsGained < 0 ? 'negative' : 'neutral',
        Efficient: yardsGained > 0,
        VideoID: play.video_url,
        GameID: play.id,
        // Store the actual play name and formation from YAML
        actualPlayName: play.play_name || '',
        actualFormation: play.play_formation || ''
      };
      
      // Update concept counts and play arrays based on play type
      if (playType === 'run') {
        // Update run concept count
        const currentCount = runConcepts.get(concept) || 0;
        runConcepts.set(concept, currentCount + 1);
        
        // Add to run plays
        runPlays.push(offensePlay);
      } else if (playType === 'pass') {
        // Update pass concept count
        const currentCount = passConcepts.get(concept) || 0;
        passConcepts.set(concept, currentCount + 1);
        
        // Add to pass plays
        passPlays.push(offensePlay);
      }
    });
    
    // Store in the conceptCounts map
    this.conceptCounts.set('Run', runConcepts);
    this.conceptCounts.set('Pass', passConcepts);
    
    // Store in the allPlays map
    this.allPlays.set('Run', runPlays);
    this.allPlays.set('Pass', passPlays);
    
    // Initialize filteredConceptCounts with all concepts
    this.filteredConceptCounts = new Map(this.conceptCounts);
    
    console.log('Processed YAML data:', {
      runConcepts: Array.from(runConcepts.entries()),
      passConcepts: Array.from(passConcepts.entries()),
      runPlays: runPlays.length,
      passPlays: passPlays.length
    });
  }

  private createRunPassPieChart() {
    // Clear any existing chart
    d3.select(this.pieChartContainer.nativeElement).selectAll('*').remove();
    
    // Get run and pass counts from the processed data
    const runPlays = this.allPlays.get('Run') || [];
    const passPlays = this.allPlays.get('Pass') || [];
    
    // Filter by down if needed
    const filteredRunPlays = this.selectedDown === 0 ? 
      runPlays : 
      runPlays.filter(play => play.Down === this.selectedDown);
    
    const filteredPassPlays = this.selectedDown === 0 ? 
      passPlays : 
      passPlays.filter(play => play.Down === this.selectedDown);
    
    // Calculate average yards
    const runAvgYards = filteredRunPlays.length > 0 ? 
      filteredRunPlays.reduce((sum, play) => sum + play.yardsGained, 0) / filteredRunPlays.length : 
      0;
    
    const passAvgYards = filteredPassPlays.length > 0 ? 
      filteredPassPlays.reduce((sum, play) => sum + play.yardsGained, 0) / filteredPassPlays.length : 
      0;
    
    // Create data for the pie chart
    const data = [
      { category: 'Run', count: filteredRunPlays.length, avgYards: parseFloat(runAvgYards.toFixed(1)) },
      { category: 'Pass', count: filteredPassPlays.length, avgYards: parseFloat(passAvgYards.toFixed(1)) }
    ];
    
    // Set chart mode
    this.chartMode = 'main';

    // Set up dimensions
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    const innerRadius = 0; // For a pie chart, inner radius is 0
    
    // Create SVG
    const svg = d3.select(this.pieChartContainer.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Define colors
    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.category))
      .range(['#3498db', '#e74c3c']);
    
    // Create pie generator
    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);
    
    // Create arc generator
    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 10);
    
    // Create hover arc generator (slightly larger)
    const hoverArc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius);
    
    // Add drop shadow filter for 3D effect
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%');
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');
    
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 3)
      .attr('dy', 3)
      .attr('result', 'offsetBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
    
    // Create pie slices
    const slices = svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'url(#drop-shadow)')
      .style('cursor', 'pointer');
    
    // Add labels
    const labels = svg.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text(d => d.data.category);
    
    // Add percentage labels (initially hidden)
    const percentages = svg.selectAll('.percentage')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('class', 'percentage')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => `${Math.round((d.data.count / d3.sum(data, d => d.count)) * 100)}%`);
    
    // Add average yards labels (initially hidden)
    const avgYardsLabels = svg.selectAll('.avg-yards')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('class', 'avg-yards')
      .attr('transform', d => `translate(${arc.centroid(d)[0]}, ${arc.centroid(d)[1] + 20})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => `Avg: ${d.data.avgYards} yds`);
    
    // Add hover effects
    slices
      .on('mouseover', (_event: MouseEvent, d: any) => {
        // If we're hovering over a different category than the active one,
        // we'll update to the new category
        if (this.activeCategory !== d.data.category) {
          // Update the active category before showing the table
          this.activeCategory = d.data.category;
        }
        
        // Enlarge the slice
        d3.select(_event.currentTarget as Element)
          .transition()
          .duration(200)
          .attr('d', hoverArc);
        
        // Hide category label and show percentage
        labels.filter(label => label.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        percentages.filter(p => p.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        avgYardsLabels.filter(a => a.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        // Show concept table for this category
        this.showConceptTable(d.data.category);
      })
      .on('mouseout', (_event: MouseEvent, d: any) => {
        // Return slice to normal size
        d3.select(_event.currentTarget as Element)
          .transition()
          .duration(200)
          .attr('d', arc);
        
        // Show category label and hide percentage
        labels.filter(label => label.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        percentages.filter(p => p.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        avgYardsLabels.filter(a => a.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        // We keep the concept table visible on mouseout
        // The table will remain visible until another category is selected
      });
      
    // Add click handler to drill down into concepts
    slices.on('click', (_event: MouseEvent, d: any) => {
      // Set this as the active category
      this.activeCategory = d.data.category;
      
      // Drill down into concepts for this category
      if (d.data.category === 'Run') {
        this.chartMode = 'run';
        this.chartTitle = 'Run Concepts Distribution';
        this.createConceptPieChart('Run');
      } else if (d.data.category === 'Pass') {
        this.chartMode = 'pass';
        this.chartTitle = 'Pass Concepts Distribution';
        this.createConceptPieChart('Pass');
      }
      
      // Show the concept table for this category
      this.showConceptTable(d.data.category);
    });
  }

  /**
   * Create a pie chart showing the distribution of concepts for a specific category (Run or Pass)
   * @param category The category to show concepts for ('Run' or 'Pass')
   */
  private createConceptPieChart(category: string) {
    // Clear any existing chart
    d3.select(this.pieChartContainer.nativeElement).selectAll('*').remove();
    
    // Get concepts for this category
    const concepts = this.filteredConceptCounts.get(category);
    if (!concepts) return;
    
    // Get plays for this category
    const plays = this.allPlays.get(category) || [];
    
    // Filter by down if needed
    const filteredPlays = this.selectedDown === 0 ? 
      plays : 
      plays.filter(play => play.Down === this.selectedDown);
    
    // Calculate concept counts and average yards for the filtered plays
    const conceptData = new Map<string, { count: number, totalYards: number }>();
    
    filteredPlays.forEach(play => {
      const concept = play.playname;
      const yards = play.yardsGained;
      
      if (!conceptData.has(concept)) {
        conceptData.set(concept, { count: 0, totalYards: 0 });
      }
      
      const data = conceptData.get(concept)!;
      data.count++;
      data.totalYards += yards;
    });
    
    // Create data for the pie chart
    const data = Array.from(conceptData.entries()).map(([concept, data]) => {
      return {
        category: concept,
        count: data.count,
        avgYards: parseFloat((data.totalYards / data.count).toFixed(1))
      };
    });
    
    // Sort by count (descending)
    data.sort((a, b) => b.count - a.count);
    
    // Set chart mode
    this.chartMode = category.toLowerCase() as 'run' | 'pass';
    
    // If no data, show a message
    if (data.length === 0) {
      d3.select(this.pieChartContainer.nativeElement)
        .append('div')
        .attr('class', 'no-data-message')
        .text(`No ${category.toLowerCase()} concepts found for the selected down.`);
      return;
    }
    
    // Set up dimensions
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    const innerRadius = 0; // For a pie chart, inner radius is 0
    
    // Create SVG
    const svg = d3.select(this.pieChartContainer.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Define colors - use a different color scheme for concepts
    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.category))
      .range(d3.schemeCategory10);
    
    // Create pie generator
    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);
    
    // Create arc generator
    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 10);
    
    // Create hover arc generator (slightly larger)
    const hoverArc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius);
    
    // Add drop shadow filter for 3D effect
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow-concept')
      .attr('height', '130%');
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');
    
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 3)
      .attr('dy', 3)
      .attr('result', 'offsetBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
    
    // Create pie slices
    const slices = svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'url(#drop-shadow-concept)')
      .style('cursor', 'pointer');
    
    // Add labels
    const labels = svg.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => {
        // Position labels based on arc size
        const centroid = arc.centroid(d);
        // For small arcs, position labels outside the pie
        if (d.endAngle - d.startAngle < 0.3) {
          const midAngle = (d.startAngle + d.endAngle) / 2;
          const x = Math.sin(midAngle) * (radius + 10);
          const y = -Math.cos(midAngle) * (radius + 10);
          return `translate(${x},${y})`;
        }
        return `translate(${centroid})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', d => (d.endAngle - d.startAngle < 0.3) ? '#333' : 'white')
      .text(d => d.data.category);
    
    // Add percentage labels (initially hidden)
    const percentages = svg.selectAll('.percentage')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('class', 'percentage')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => `${Math.round((d.data.count / d3.sum(data, d => d.count)) * 100)}%`);
    
    // Add average yards labels (initially hidden)
    const avgYardsLabels = svg.selectAll('.avg-yards')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('class', 'avg-yards')
      .attr('transform', d => `translate(${arc.centroid(d)[0]}, ${arc.centroid(d)[1] + 15})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => `Avg: ${d.data.avgYards} yds`);
    
    // Add hover effects
    slices
      .on('mouseover', (_event: MouseEvent, d: any) => {
        // Enlarge the slice
        d3.select(_event.currentTarget as Element)
          .transition()
          .duration(200)
          .attr('d', hoverArc);
        
        // Hide category label and show percentage
        labels.filter(label => label.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        percentages.filter(p => p.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        avgYardsLabels.filter(a => a.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 1);
          
        // Show all instances of this concept in the table
        this.showConceptPlaysTable(category, d.data.category);
      })
      .on('mouseout', (_event: MouseEvent, d: any) => {
        // Return slice to normal size
        d3.select(_event.currentTarget as Element)
          .transition()
          .duration(200)
          .attr('d', arc);
        
        // Show category label and hide percentage
        labels.filter(label => label.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        percentages.filter(p => p.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 0);
        
        avgYardsLabels.filter(a => a.data.category === d.data.category)
          .transition()
          .duration(200)
          .style('opacity', 0);
      });
    
    // Add legend
    const legendContainer = d3.select(this.pieChartContainer.nativeElement)
      .append('div')
      .attr('class', 'legend-container')
      .style('margin-top', '20px')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('justify-content', 'center');
    
    // Create legend items
    data.forEach((d, i) => {
      const legendItem = legendContainer.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin', '0 10px 5px 0');
      
      legendItem.append('div')
        .style('width', '12px')
        .style('height', '12px')
        .style('background-color', color(d.category))
        .style('margin-right', '5px');
      
      legendItem.append('span')
        .text(`${d.category} (${d.count})`);
    });
  }
  
  private createMockConceptData() {
    // Create mock data for Run concepts
    const runConcepts = new Map<string, number>();
    runConcepts.set('Inside Zone', 12);
    runConcepts.set('Power', 8);
    runConcepts.set('Outside Zone', 6);
    runConcepts.set('Counter', 5);
    runConcepts.set('Draw', 4);
    
    // Create mock data for Pass concepts
    const passConcepts = new Map<string, number>();
    passConcepts.set('Slant', 7);
    passConcepts.set('Curl', 5);
    passConcepts.set('Vertical', 10);
    passConcepts.set('Screen', 8);
    passConcepts.set('Out', 6);
    passConcepts.set('Cross', 9);
    
    // Store in the conceptCounts map
    this.conceptCounts.set('Run', runConcepts);
    this.conceptCounts.set('Pass', passConcepts);
    
    // Create mock play data for Run
    const runPlays: OffensePlay[] = [
      { playID: 1, playname: 'Inside Zone', yardsGained: 5, Down: 1, Distance: 10, Result: 'Success', Efficient: true, actualPlayName: 'I-Formation Inside Zone', actualFormation: 'I-Formation' },
      { playID: 2, playname: 'Inside Zone', yardsGained: 3, Down: 2, Distance: 5, Result: 'Success', Efficient: true, actualPlayName: 'Single Back Inside Zone', actualFormation: 'Single Back' },
      { playID: 3, playname: 'Power', yardsGained: 8, Down: 1, Distance: 10, Result: 'Success', Efficient: true, actualPlayName: 'Pistol Power', actualFormation: 'Pistol' },
      // Add more mock plays as needed
    ];
    
    // Create mock play data for Pass
    const passPlays: OffensePlay[] = [
      { playID: 4, playname: 'Slant', yardsGained: 12, Down: 2, Distance: 8, Result: 'Success', Efficient: true, actualPlayName: 'Shotgun Slant', actualFormation: 'Shotgun' },
      { playID: 5, playname: 'Curl', yardsGained: 0, Down: 3, Distance: 5, Result: 'Incomplete', Efficient: false, actualPlayName: 'Spread Curl', actualFormation: 'Spread' },
      { playID: 6, playname: 'Vertical', yardsGained: 25, Down: 1, Distance: 10, Result: 'Success', Efficient: true, actualPlayName: 'Empty Vertical', actualFormation: 'Empty' },
      // Add more mock plays as needed
    ];
    
    // Store in the allPlays map
    this.allPlays.set('Run', runPlays);
    this.allPlays.set('Pass', passPlays);
    
    // Initialize filteredConceptCounts with all concepts
    this.filteredConceptCounts = new Map(this.conceptCounts);
  }

  /**
   * Show a table of all plays for a specific concept
   * @param category The main category ('Run' or 'Pass')
   * @param concept The specific concept to show plays for (e.g., 'Inside Zone', 'Slant')
   */
  private showConceptPlaysTable(category: string, concept: string) {
    // Clear any existing table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
    
    // Get plays for this category
    const plays = this.allPlays.get(category);
    if (!plays) return;
    
    // Filter plays by concept and down
    const filteredPlays = plays.filter(play => {
      const matchesConcept = play.playname === concept;
      const matchesDown = this.selectedDown === 0 || play.Down === this.selectedDown;
      return matchesConcept && matchesDown;
    });
    
    if (filteredPlays.length === 0) {
      // No plays found for this concept and down
      d3.select(this.conceptTableContainer.nativeElement)
        .append('div')
        .attr('class', 'no-data-message')
        .text(`No plays found for ${concept} on ${this.selectedDown === 0 ? 'all downs' : `${this.selectedDown}${this.getOrdinalSuffix(this.selectedDown)} down`}.`);
      return;
    }
    
    // Calculate total yards and average
    const totalYards = filteredPlays.reduce((sum, play) => sum + play.yardsGained, 0);
    const avgYards = parseFloat((totalYards / filteredPlays.length).toFixed(1));
    
    // Create table container
    const tableContainer = d3.select(this.conceptTableContainer.nativeElement)
      .append('div')
      .attr('class', 'table-container');
    
    // Add title and stats
    const headerContainer = tableContainer.append('div')
      .style('margin-bottom', '15px');
    
    headerContainer.append('div')
      .attr('class', 'table-title')
      .text(`${concept} Plays (${category})`);
    
    const statsContainer = headerContainer.append('div')
      .style('display', 'flex')
      .style('gap', '15px')
      .style('margin-top', '5px');
    
    statsContainer.append('div')
      .text(`Total Plays: ${filteredPlays.length}`);
    
    statsContainer.append('div')
      .attr('class', avgYards > 0 ? 'positive-yards' : avgYards < 0 ? 'negative-yards' : 'neutral-yards')
      .text(`Avg. Yards: ${avgYards}`);
    
    // Create table
    const table = tableContainer.append('table')
      .attr('class', 'concept-table');
    
    // Add table header
    const thead = table.append('thead');
    thead.append('tr')
      .selectAll('th')
      .data(['Play Name', 'Formation', 'Down', 'Distance', 'Yards', 'Result'])
      .enter()
      .append('th')
      .text(d => d);
    
    // Add table body
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr')
      .data(filteredPlays)
      .enter()
      .append('tr')
      .style('cursor', 'pointer');
    
    // Generate a unique play name based on the concept and an identifier
    const getPlayName = (concept: string, id: number) => {
      // Create more descriptive play names based on the concept
      const playVariants = {
        'Inside Zone': ['Inside Zone Left', 'Inside Zone Right', 'Inside Zone Split', 'Inside Zone Read'],
        'Outside Zone': ['Outside Zone Left', 'Outside Zone Right', 'Outside Zone Stretch', 'Outside Zone Sweep'],
        'Power': ['Power Right', 'Power Left', 'Counter Power', 'Power G'],
        'Counter': ['Counter Left', 'Counter Right', 'Counter Trey', 'H-Counter'],
        'Draw': ['Draw Middle', 'Delay Draw', 'QB Draw', 'Draw Screen'],
        'Slant': ['Quick Slant', 'Slant & Go', 'Double Slant', 'Slant Flat'],
        'Curl': ['Curl Flat', 'Smash Curl', 'Curl & Go', 'Sit Curl'],
        'Vertical': ['Four Verticals', 'Seam Vertical', 'Switch Vertical', 'Dagger'],
        'Screen': ['RB Screen', 'Bubble Screen', 'Tunnel Screen', 'Jailbreak Screen'],
        'Out': ['Quick Out', 'Out & Up', 'Corner Out', 'Flat Out'],
        'Cross': ['Shallow Cross', 'Deep Cross', 'Mesh Cross', 'Drive Cross']
      };
      
    };
    
    // Generate a formation name based on the concept and play type
    const getFormation = (concept: string, playType: string, id: number) => {
      // Create formation names appropriate for the play type
      const runFormations = ['I-Formation', 'Single Back', 'Pistol', 'Shotgun', 'Wildcat', 'Wing-T'];
      const passFormations = ['Shotgun', 'Spread', 'Trips', 'Empty', 'Bunch', 'Ace'];
      
      // Use the appropriate formation list based on play type
      const formations = playType.toLowerCase() === 'run' ? runFormations : passFormations;
      
      // Use modulo to cycle through the formations
      return formations[id % formations.length];
    };
    
    // Add play name (clickable)
    // Add play name with pointer cursor to indicate it's clickable
    rows.append('td')
      .attr('class', 'play-name')
      .text(d => d.actualPlayName || getPlayName(concept, d.playID) || '') // Use actual play name from YAML if available, ensure string return
      .attr('style', 'cursor: pointer;')
      .on('click', (_event, d) => {
        // Get the play name and formation from actual data if available, otherwise use helper functions
        const playName = d.actualPlayName || getPlayName(concept, d.playID) || '';
        const formation = d.actualFormation || getFormation(concept, category, d.playID) || '';
        
        // Convert OffensePlay to FootballPlay format for the modal
        const footballPlay: FootballPlay = {
          id: d.GameID || '',
          play_id: d.playID.toString(),
          play_type: category.toLowerCase(),
          yards_gained: typeof d.yardsGained === 'number' ? d.yardsGained : 0,
          down: d.Down,
          distance: d.Distance,
          play_concept: concept,
          play_formation: formation,
          play_name: playName,
          video_url: d.VideoID || 'https://www.youtube.com/embed/b-L2ckBDgcE',
          qtr: 1, // Default values for mock data
          home_team: 'Home',
          away_team: 'Away',
          notes: `${concept} play on ${d.Down}${this.getOrdinalSuffix(d.Down)} down`
        };
        
        // Open the play modal
        this.playModalService.openModal(footballPlay);
      });
    
    // Add formation - use actual formation from YAML data if available
    rows.append('td')
      .text(d => d.actualFormation || getFormation(concept, category, d.playID));
    
    // Add down
    rows.append('td')
      .text(d => d.Down);
    
    // Add distance
    rows.append('td')
      .text(d => d.Distance);
    
    // Add yards gained (with color coding)
    rows.append('td')
      .attr('class', d => {
        if (d.yardsGained > 0) return 'positive-yards';
        if (d.yardsGained < 0) return 'negative-yards';
        return 'neutral-yards';
      })
      .text(d => d.yardsGained);
    
    // Add result
    rows.append('td')
      .text(d => d.Result);
  }
  
  /**
   * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
   */
  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
  
  private showConceptTable(category: string) {
    // Clear any existing table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
    
    // Update the active category
    this.activeCategory = category;
    
    // Get concepts for this category
    const concepts = this.filteredConceptCounts.get(category);
    if (!concepts) return;
    
    // Get plays for this category
    const plays = this.allPlays.get(category);
    if (!plays) return;
    
    // Calculate average yards for each concept
    const conceptAvgYards = new Map<string, number>();
    const conceptPlayCounts = new Map<string, number>();
    
    plays.forEach(play => {
      // Filter by down if needed
      if (this.selectedDown !== 0 && play.Down !== this.selectedDown) return;
      
      const concept = play.playname;
      const yards = play.yardsGained;
      
      // Update total yards
      const currentYards = conceptAvgYards.get(concept) || 0;
      conceptAvgYards.set(concept, currentYards + yards);
      
      // Update play count
      const currentCount = conceptPlayCounts.get(concept) || 0;
      conceptPlayCounts.set(concept, currentCount + 1);
    });
    
    // Calculate averages
    conceptPlayCounts.forEach((count, concept) => {
      const totalYards = conceptAvgYards.get(concept) || 0;
      conceptAvgYards.set(concept, parseFloat((totalYards / count).toFixed(1)));
    });
    
    // Prepare data for sorting
    const tableData = Array.from(concepts.entries()).map(([concept, count]) => {
      return {
        concept: concept,
        count: count,
        avgYards: conceptAvgYards.get(concept) || 0
      };
    });
    
    console.log('Table data before sorting:', JSON.stringify(tableData));
    
    // Default sort by average yards (descending)
    let currentSortField = 'avgYards';
    let sortAscending = false;
    
    // Apply initial sort
    this.sortTableData(tableData, currentSortField, sortAscending);
    
    console.log('Table data after initial sort:', JSON.stringify(tableData));
    
    // Create table container
    const tableContainer = d3.select(this.conceptTableContainer.nativeElement)
      .append('div')
      .attr('class', 'table-container');
    
    // Add title
    tableContainer.append('div')
      .attr('class', 'table-title')
      .text(`${category} Concepts`);
    
    // Create table
    const table = tableContainer.append('table')
      .attr('class', 'concept-table');
    
    // Add header with sort functionality
    const thead = table.append('thead');
    const headerRow = thead.append('tr');
    
    // Create sortable headers
    const headers = [
      { field: 'concept', label: 'Concept' },
      { field: 'count', label: 'Count' },
      { field: 'avgYards', label: 'Avg. Yards' }
    ];
    
    headers.forEach(header => {
      headerRow.append('th')
        .attr('class', () => {
          let classes = 'sortable';
          if (currentSortField === header.field) {
            classes += sortAscending ? ' sort-asc' : ' sort-desc';
          }
          return classes;
        })
        .text(header.label)
        .append('span')
        .attr('class', 'sort-icon')
        .text(() => {
          if (currentSortField === header.field) {
            return sortAscending ? ' ▲' : ' ▼';
          }
          return '';
        })
        .style('font-size', '0.8em')
        .style('margin-left', '5px')
        .style('opacity', () => currentSortField === header.field ? 1 : 0.3);
    });
    
    // Store reference to this for use in event handlers
    const that = this;
    
    // Add click handlers for sorting
    headerRow.selectAll('th').on('click', function(this: any, event: MouseEvent, d: any) {
      // Get the index of the clicked header
      const headerIndex = Array.from(headerRow.selectAll('th').nodes()).indexOf(this);
      const field = headers[headerIndex].field;
      
      console.log('Sorting by field:', field);
      
      // Toggle sort direction if clicking the same header again
      if (currentSortField === field) {
        sortAscending = !sortAscending;
      } else {
        currentSortField = field;
        // Default to ascending for concept, descending for numeric fields
        sortAscending = field === 'concept';
      }
      
      console.log('Sort direction:', sortAscending ? 'ascending' : 'descending');
      
      // Sort the data
      that.sortTableData(tableData, currentSortField, sortAscending);
      
      // Log the sorted data for debugging
      console.log('Sorted data:', tableData);
      
      // Create a new table with the sorted data instead of recursively calling showConceptTable
      // which would cause an infinite loop
      that.renderSortedTable(tableData, category, currentSortField, sortAscending);
    });
    
    // Add rows
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr')
      .data(tableData)
      .enter()
      .append('tr');
    
    // Add concept name
    rows.append('td')
      .text(d => d.concept);
    
    // Add count
    rows.append('td')
      .text(d => d.count);
    
    // Add average yards with color coding
    rows.append('td')
      .text(d => d.avgYards.toFixed(1))
      .style('color', d => d.avgYards >= 4 ? 'green' : 'red')
      .style('font-weight', 'bold');
  }
  
  /**
   * Sort table data by the specified field
   * @param data The data to sort
   * @param field The field to sort by
   * @param ascending Whether to sort in ascending order
   */
  private sortTableData(data: any[], field: string, ascending: boolean): void {
    // Make a copy of the data to avoid reference issues
    const dataCopy = [...data];
    
    // Clear the original array
    data.length = 0;
    
    // Sort the copy
    dataCopy.sort((a, b) => {
      let comparison = 0;
      
      if (field === 'concept') {
        // String comparison for concept names
        comparison = String(a.concept).localeCompare(String(b.concept));
      } else {
        // Numeric comparison for count and avgYards
        comparison = Number(a[field]) - Number(b[field]);
      }
      
      // Reverse if descending order
      return ascending ? comparison : -comparison;
    });
    
    // Push the sorted items back into the original array
    dataCopy.forEach(item => data.push(item));
    
    console.log('Sorted data by', field, ascending ? 'ascending' : 'descending');
  }

  /**
   * Render a sorted table without recursively calling showConceptTable
   */
  private renderSortedTable(data: any[], category: string, sortField: string, sortAscending: boolean) {
    // Clear any existing table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
    
    // Create table container
    const tableContainer = d3.select(this.conceptTableContainer.nativeElement)
      .append('div')
      .attr('class', 'table-container');
    
    // Add title
    tableContainer.append('div')
      .attr('class', 'table-title')
      .text(`${category} Concepts`);
    
    // Create table
    const table = tableContainer.append('table')
      .attr('class', 'concept-table');
    
    // Add header with sort functionality
    const thead = table.append('thead');
    const headerRow = thead.append('tr');
    
    // Create sortable headers
    const headers = [
      { field: 'concept', label: 'Concept' },
      { field: 'count', label: 'Count' },
      { field: 'avgYards', label: 'Avg. Yards' }
    ];
    
    const that = this;
    
    headers.forEach(header => {
      headerRow.append('th')
        .attr('class', () => {
          let classes = 'sortable';
          if (sortField === header.field) {
            classes += sortAscending ? ' sort-asc' : ' sort-desc';
          }
          return classes;
        })
        .text(header.label)
        .append('span')
        .attr('class', 'sort-icon')
        .text(() => {
          if (sortField === header.field) {
            return sortAscending ? ' ▲' : ' ▼';
          }
          return '';
        })
        .style('font-size', '0.8em')
        .style('margin-left', '5px')
        .style('opacity', () => sortField === header.field ? 1 : 0.3);
    });
    
    // Add click handlers for sorting
    headerRow.selectAll('th').on('click', function(this: any, event: MouseEvent, d: any) {
      // Get the index of the clicked header
      const headerIndex = Array.from(headerRow.selectAll('th').nodes()).indexOf(this);
      const field = headers[headerIndex].field;
      
      console.log('Sorting by field:', field);
      
      // Toggle sort direction if clicking the same header again
      if (sortField === field) {
        sortAscending = !sortAscending;
      } else {
        sortField = field;
        // Default to ascending for concept, descending for numeric fields
        sortAscending = field === 'concept';
      }
      
      console.log('Sort direction:', sortAscending ? 'ascending' : 'descending');
      
      // Sort the data
      that.sortTableData(data, field, sortAscending);
      
      // Log the sorted data for debugging
      console.log('Sorted data:', data);
      
      // Render the table again with the sorted data
      that.renderSortedTable(data, category, field, sortAscending);
    });
    
    // Add rows
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr')
      .data(data)
      .enter()
      .append('tr');
    
    // Add concept name
    rows.append('td')
      .text(d => d.concept);
    
    // Add count
    rows.append('td')
      .text(d => d.count);
    
    // Add average yards with color coding
    rows.append('td')
      .text(d => d.avgYards.toFixed(1))
      .style('color', d => d.avgYards >= 4 ? 'green' : 'red')
      .style('font-weight', 'bold');
  }
  
  private hideConceptTable() {
    // Clear the concept table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
    this.activeCategory = null; // Reset active category
  }
}
