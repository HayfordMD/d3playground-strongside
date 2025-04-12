import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Router } from '@angular/router';
import { YamlDataService } from '../services/yaml-data.service';
import { FootballPlay } from '../models/football-play.model';

interface OffensePlay {
  playID: number;
  playname: string;
  yardsGained: number;
  Down: number;
  Distance: number;
  Result: string;
  Efficient: boolean;
  VideoID?: string;
  GameID?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: `
    <h1>Offensive Breakdown Analysis</h1>
    <div class="pie-chart-container">
      <h2>Run vs Pass Distribution</h2>
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
export class HomeComponent implements OnInit {
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

  constructor(private router: Router, private yamlDataService: YamlDataService) {}

  ngOnInit() {
    this.loadYamlData();
  }

  filterByDown(down: number) {
    this.selectedDown = down;
    this.hideConceptTable(); // Clear the concept table when changing filters
    this.createRunPassPieChart();
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

  private processYamlData(data: FootballPlay[]) {
    // Clear existing data
    this.conceptCounts.clear();
    this.allPlays.clear();
    
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
        GameID: play.id
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
        // hide the previous concept table
        if (this.activeCategory && this.activeCategory !== d.data.category) {
          // No need to call hideConceptTable() as we'll replace it with the new one
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
        
        // Update the active category
        this.activeCategory = d.data.category;
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
        
        // We no longer hide the concept table on mouseout
        // The table will remain visible until another segment is hovered
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
      { playID: 1, playname: 'Inside Zone', yardsGained: 5, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 2, playname: 'Inside Zone', yardsGained: 3, Down: 2, Distance: 5, Result: 'Success', Efficient: true },
      { playID: 3, playname: 'Power', yardsGained: 8, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      // Add more mock plays as needed
    ];
    
    // Create mock play data for Pass
    const passPlays: OffensePlay[] = [
      { playID: 4, playname: 'Slant', yardsGained: 12, Down: 2, Distance: 8, Result: 'Success', Efficient: true },
      { playID: 5, playname: 'Curl', yardsGained: 0, Down: 3, Distance: 5, Result: 'Incomplete', Efficient: false },
      { playID: 6, playname: 'Vertical', yardsGained: 25, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      // Add more mock plays as needed
    ];
    
    // Store in the allPlays map
    this.allPlays.set('Run', runPlays);
    this.allPlays.set('Pass', passPlays);
    
    // Initialize filteredConceptCounts with all concepts
    this.filteredConceptCounts = new Map(this.conceptCounts);
  }

  private showConceptTable(category: string) {
    // Clear any existing table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
    
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
    
    // Add header
    const thead = table.append('thead');
    thead.append('tr')
      .selectAll('th')
      .data(['Concept', 'Count', 'Avg. Yards'])
      .enter()
      .append('th')
      .text(d => d);
    
    // Add rows
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr')
      .data(Array.from(concepts.entries()))
      .enter()
      .append('tr');
    
    // Add concept name
    rows.append('td')
      .text(d => d[0]);
    
    // Add count
    rows.append('td')
      .text(d => d[1]);
    
    // Add average yards with color coding
    rows.append('td')
      .text(d => {
        const avgYards = conceptAvgYards.get(d[0]) || 0;
        return avgYards.toFixed(1);
      })
      .style('color', d => {
        const avgYards = conceptAvgYards.get(d[0]) || 0;
        return avgYards >= 4 ? 'green' : 'red';
      })
      .style('font-weight', 'bold');
  }

  private hideConceptTable() {
    // Clear the concept table
    d3.select(this.conceptTableContainer.nativeElement).selectAll('*').remove();
    this.activeCategory = null; // Reset active category
  }
}
