import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PlayModalComponent } from './shared/play-modal/play-modal.component';
import { PlayModalService } from './services/play-modal.service';
import * as d3 from 'd3';
import * as yaml from 'js-yaml';

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

interface OffenseConcept {
  name: string;
}

interface OffenseFormation {
  name: string;
  concepts: OffenseConcept[];
  plays: OffensePlay[];
}

interface OffenseCategory {
  category: string;
  formations: OffenseFormation[];
}

interface OffenseData {
  offenseBreakdown: OffenseCategory[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PlayModalComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="container">
          <h1>Football Analytics Dashboard</h1>
          <nav class="app-nav">
            <a routerLink="/home" routerLinkActive="active" class="nav-link">Run Pass Distro</a>
            <a routerLink="/yaml-data" routerLinkActive="active" class="nav-link">Macaroo Table</a>
            <a routerLink="/treemap" routerLinkActive="active" class="nav-link">Concept Treemap</a>
            <a routerLink="/ai-created-example" routerLinkActive="active" class="nav-link">AI Created Example</a>
            <a routerLink="/formation-breakdown" routerLinkActive="active" class="nav-link">Formation Breakdown</a>
          </nav>
        </div>
      </header>
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Play Video Modal Component -->
      <app-play-modal 
        [isOpen]="modalService.isOpen" 
        [play]="modalService.currentPlay"
        (closeEvent)="modalService.closeModal()">
      </app-play-modal>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Arial', sans-serif;
      color: #333;
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
    }
    
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
    }
    .app-header {
      background-color: #2c3e50;
      color: white;
      padding: 0;
      width: 100%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .app-header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.8rem 1.5rem;
    }
    
    .app-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
    }
    
    .app-nav {
      display: flex;
      gap: 1.5rem;
    }
    
    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .nav-link:hover {
      background-color: #3498db;
      transform: translateY(-2px);
    }
    
    .app-content {
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      width: 100%;
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
    .concept-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background-color: white;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .concept-table th, .concept-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e1e1e1;
    }
    .concept-table th {
      background-color: #f1f1f1;
      font-weight: bold;
    }
    .concept-table tr:last-child td {
      border-bottom: none;
    }
    .concept-table tr:hover {
      background-color: #f9f9f9;
    }
    .table-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #2c3e50;
    }
  `],
})
export class AppComponent implements OnInit {
  @ViewChild('pieChart', { static: true }) private pieChartContainer!: ElementRef;
  @ViewChild('conceptTable', { static: true }) private conceptTableContainer!: ElementRef;
  
  private offenseData: OffenseData | null = null;
  private conceptCounts: Map<string, Map<string, number>> = new Map();
  private filteredConceptCounts: Map<string, Map<string, number>> = new Map();
  private allPlays: Map<string, OffensePlay[]> = new Map();
  selectedDown: number = 0; // 0 means all downs

  constructor(public modalService: PlayModalService) {}

  ngOnInit() {
    this.loadYamlData();
  }

  private async loadYamlData() {
    try {
      // Since we're having issues loading the YAML, let's use mock data directly
      console.log('Skipping YAML loading and using mock data directly');
      
      // Create mock concept data
      this.createMockConceptData();
      
      // Create the pie chart with mock data
      this.createRunPassPieChartWithMockData();
      

    } catch (error) {
      console.error('Error loading YAML data:', error);
      // Fallback to hardcoded data
      this.createRunPassPieChartWithMockData();
      
      // Since YAML loading failed, let's create some mock concept data
      this.createMockConceptData();
    }
  }

  private processConceptCounts() {
    if (!this.offenseData) return;

    console.log('Processing concept counts from YAML data');
    
    // For each category (Run/Pass)
    this.offenseData.offenseBreakdown.forEach(category => {
      const conceptMap = new Map<string, number>();
      console.log(`Processing category: ${category.category}`);
      
      // Go through each formation in the category
      category.formations.forEach(formation => {
        console.log(`  Formation: ${formation.name}, Concepts:`, formation.concepts);
        
        // Count each concept
        formation.concepts.forEach(concept => {
          const conceptName = concept.name;
          const currentCount = conceptMap.get(conceptName) || 0;
          conceptMap.set(conceptName, currentCount + 1);
          console.log(`    Concept: ${conceptName}, Count: ${currentCount + 1}`);
        });
      });
      
      // Store the concept counts for this category
      this.conceptCounts.set(category.category, conceptMap);
      console.log(`Stored ${conceptMap.size} concepts for ${category.category}:`, 
                 Array.from(conceptMap.entries()));
    });
  }
  
  private createMockConceptData() {
    console.log('Creating mock concept data');
    
    // Create mock concept data for Run
    const runConcepts = new Map<string, number>();
    runConcepts.set('Power', 3);
    runConcepts.set('Inside Zone', 4);
    runConcepts.set('Outside Zone', 2);
    runConcepts.set('Counter', 1);
    runConcepts.set('Trap', 1);
    this.conceptCounts.set('Run', runConcepts);
    
    // Create mock concept data for Pass
    const passConcepts = new Map<string, number>();
    passConcepts.set('Smash', 2);
    passConcepts.set('Mesh', 2);
    passConcepts.set('Four Verticals', 3);
    passConcepts.set('Flood', 1);
    passConcepts.set('Screens', 1);
    this.conceptCounts.set('Pass', passConcepts);
    
    // Create mock play data for filtering by down
    const runPlays: OffensePlay[] = [
      { playID: 1, playname: 'Power', yardsGained: 5, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 2, playname: 'Inside Zone', yardsGained: 4, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 3, playname: 'Inside Zone', yardsGained: 2, Down: 2, Distance: 6, Result: 'Failure', Efficient: false },
      { playID: 4, playname: 'Power', yardsGained: 7, Down: 2, Distance: 8, Result: 'Success', Efficient: true },
      { playID: 5, playname: 'Outside Zone', yardsGained: 1, Down: 3, Distance: 2, Result: 'Failure', Efficient: false },
      { playID: 6, playname: 'Counter', yardsGained: 3, Down: 3, Distance: 1, Result: 'Success', Efficient: true },
      { playID: 7, playname: 'Inside Zone', yardsGained: 6, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 8, playname: 'Trap', yardsGained: 2, Down: 4, Distance: 1, Result: 'Success', Efficient: true },
      { playID: 9, playname: 'Power', yardsGained: 0, Down: 2, Distance: 3, Result: 'Failure', Efficient: false },
      { playID: 10, playname: 'Outside Zone', yardsGained: 8, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 11, playname: 'Inside Zone', yardsGained: 3, Down: 3, Distance: 5, Result: 'Failure', Efficient: false }
    ];
    
    const passPlays: OffensePlay[] = [
      { playID: 12, playname: 'Smash', yardsGained: 12, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 13, playname: 'Mesh', yardsGained: 6, Down: 2, Distance: 7, Result: 'Success', Efficient: true },
      { playID: 14, playname: 'Four Verticals', yardsGained: 22, Down: 3, Distance: 8, Result: 'Success', Efficient: true },
      { playID: 15, playname: 'Four Verticals', yardsGained: 0, Down: 3, Distance: 10, Result: 'Failure', Efficient: false },
      { playID: 16, playname: 'Flood', yardsGained: 8, Down: 2, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 17, playname: 'Screens', yardsGained: 4, Down: 1, Distance: 10, Result: 'Success', Efficient: true },
      { playID: 18, playname: 'Smash', yardsGained: 15, Down: 2, Distance: 15, Result: 'Success', Efficient: true },
      { playID: 19, playname: 'Mesh', yardsGained: 2, Down: 3, Distance: 4, Result: 'Failure', Efficient: false },
      { playID: 20, playname: 'Four Verticals', yardsGained: 35, Down: 1, Distance: 10, Result: 'Success', Efficient: true }
    ];
    
    this.allPlays.set('Run', runPlays);
    this.allPlays.set('Pass', passPlays);
    
    // Initialize filtered concept counts with all plays
    this.filteredConceptCounts = new Map(this.conceptCounts);
    
    console.log('Mock concept data created:', 
               Array.from(this.conceptCounts.entries()).map(([k, v]) => 
                 [k, Array.from(v.entries())]));
  }
  
  // Mock data for average yards gained
  private getAverageYardsGained(category: string): number {
    // If we have filtered by down, calculate the average yards for that down only
    if (this.selectedDown > 0) {
      const plays = this.allPlays.get(category) || [];
      const downPlays = plays.filter(play => play.Down === this.selectedDown);
      
      if (downPlays.length > 0) {
        const totalYards = downPlays.reduce((sum, play) => sum + play.yardsGained, 0);
        return totalYards / downPlays.length;
      }
    }
    
    // Fall back to hardcoded values if no filtered data
    if (category === 'Run') {
      return 4.2; // Average yards per run play
    } else if (category === 'Pass') {
      return 7.8; // Average yards per pass play
    }
    return 0;
  }
  
  // Mock data for average yards gained per concept
  private getConceptAverageYards(category: string, concept: string): number {
    // If we have filtered by down, calculate the average yards for that down only
    if (this.selectedDown > 0) {
      const plays = this.allPlays.get(category) || [];
      const conceptPlays = plays.filter(play => 
        play.playname === concept && play.Down === this.selectedDown
      );
      
      if (conceptPlays.length > 0) {
        const totalYards = conceptPlays.reduce((sum, play) => sum + play.yardsGained, 0);
        return totalYards / conceptPlays.length;
      }
    }
    
    // Fall back to hardcoded values if no filtered data or no plays found
    const conceptYards: {[key: string]: number} = {
      // Run concepts
      'Power': 5.3,
      'Inside Zone': 4.8,
      'Outside Zone': 6.2,
      'Counter': 3.7,
      'Trap': 3.1,
      'Sweep': 5.9,
      'Iso': 3.5,
      
      // Pass concepts
      'Smash': 8.4,
      'Mesh': 6.2,
      'Four Verticals': 12.5,
      'Flood': 7.8,
      'Screens': 5.3,
      'Y-Corner': 9.7,
      '4 Verts': 15.3,
      'Hitch': 5.8,
      'Snag': 7.2,
      'Hank': 6.5,
      'Y-Cross': 11.2
    };
    
    return conceptYards[concept] || 0;
  }

  private createRunPassPieChartWithMockData(): void {
    // Get filtered counts based on selected down
    this.updateFilteredData();
    
    // Calculate total counts for Run and Pass based on filtered data
    let runCount = 0;
    let passCount = 0;
    
    if (this.selectedDown === 0) {
      // If all downs selected, use the original counts
      runCount = 11;
      passCount = 9;
    } else {
      // Count plays for the selected down
      const runPlays = this.allPlays.get('Run') || [];
      const passPlays = this.allPlays.get('Pass') || [];
      
      runCount = runPlays.filter(play => play.Down === this.selectedDown).length;
      passCount = passPlays.filter(play => play.Down === this.selectedDown).length;
    }
    
    const runPassData = [
      { category: 'Run', count: runCount },
      { category: 'Pass', count: passCount }
    ];
    
    this.renderPieChart(runPassData);
  }

  private createRunPassPieChart(): void {
    if (!this.offenseData) return;

    // Count plays for each category
    const runPassData = this.offenseData.offenseBreakdown.map(category => {
      // Count total plays in this category
      const playCount = category.formations.reduce((total, formation) => {
        return total + formation.plays.length;
      }, 0);

      return {
        category: category.category,
        count: playCount
      };
    });

    this.renderPieChart(runPassData);
  }

  private showConceptTable(category: string): void {
    const tableContainer = this.conceptTableContainer.nativeElement;
    
    // Clear any existing table
    tableContainer.innerHTML = '';
    
    // Get concept counts for this category from filtered data
    const conceptMap = this.filteredConceptCounts.get(category);
    
    if (!conceptMap || conceptMap.size === 0) {
      tableContainer.innerHTML = `<div class="table-title">No concepts found for ${category}</div>`;
      return;
    }
    
    // Create table title
    const titleElement = document.createElement('div');
    titleElement.className = 'table-title';
    titleElement.textContent = `${category} Concepts`;
    tableContainer.appendChild(titleElement);
    
    // Create table
    const table = document.createElement('table');
    table.className = 'concept-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const conceptHeader = document.createElement('th');
    conceptHeader.textContent = 'Concept';
    headerRow.appendChild(conceptHeader);
    
    const countHeader = document.createElement('th');
    countHeader.textContent = 'Count';
    headerRow.appendChild(countHeader);
    
    const yardsHeader = document.createElement('th');
    yardsHeader.textContent = 'Avg Yards';
    headerRow.appendChild(yardsHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Convert Map to array and sort by count (descending)
    const sortedConcepts = Array.from(conceptMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Add rows for each concept
    sortedConcepts.forEach(([conceptName, count]) => {
      const row = document.createElement('tr');
      
      const conceptCell = document.createElement('td');
      conceptCell.textContent = conceptName;
      row.appendChild(conceptCell);
      
      const countCell = document.createElement('td');
      countCell.textContent = count.toString();
      row.appendChild(countCell);
      
      // Get and add average yards for this concept
      const avgYards = this.getConceptAverageYards(category, conceptName);
      const yardsCell = document.createElement('td');
      yardsCell.textContent = avgYards.toFixed(1);
      
      // Highlight cells with high yardage
      if (avgYards > 7) {
        yardsCell.style.color = '#2ca02c'; // Green for good yardage
        yardsCell.style.fontWeight = 'bold';
      } else if (avgYards < 4) {
        yardsCell.style.color = '#d62728'; // Red for poor yardage
      }
      
      row.appendChild(yardsCell);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }
  
  private hideConceptTable(): void {
    // Clear the table container
    if (this.conceptTableContainer) {
      this.conceptTableContainer.nativeElement.innerHTML = '';
    }
  }
  
  // Filter data by down
  filterByDown(down: number): void {
    if (this.selectedDown === down) return; // No change needed
    
    this.selectedDown = down;
    this.updateFilteredData();
    this.createRunPassPieChartWithMockData();
    
    // Clear the concept table when changing filters
    this.hideConceptTable();
  }
  
  // Update filtered data based on selected down
  private updateFilteredData(): void {
    if (this.selectedDown === 0) {
      // If all downs selected, use the original counts
      this.filteredConceptCounts = new Map(this.conceptCounts);
      return;
    }
    
    // Filter concept counts by down
    this.filteredConceptCounts = new Map();
    
    // Process Run concepts
    const runPlays = this.allPlays.get('Run') || [];
    const filteredRunPlays = runPlays.filter(play => play.Down === this.selectedDown);
    const runConcepts = new Map<string, number>();
    
    // Count occurrences of each concept in filtered plays
    filteredRunPlays.forEach(play => {
      const conceptName = play.playname;
      const currentCount = runConcepts.get(conceptName) || 0;
      runConcepts.set(conceptName, currentCount + 1);
    });
    
    this.filteredConceptCounts.set('Run', runConcepts);
    
    // Process Pass concepts
    const passPlays = this.allPlays.get('Pass') || [];
    const filteredPassPlays = passPlays.filter(play => play.Down === this.selectedDown);
    const passConcepts = new Map<string, number>();
    
    // Count occurrences of each concept in filtered plays
    filteredPassPlays.forEach(play => {
      const conceptName = play.playname;
      const currentCount = passConcepts.get(conceptName) || 0;
      passConcepts.set(conceptName, currentCount + 1);
    });
    
    this.filteredConceptCounts.set('Pass', passConcepts);
  }
  
  private renderPieChart(data: {category: string, count: number}[]): void {
    const element = this.pieChartContainer.nativeElement;
    const width = 225;  // Reduced from 450
    const height = 225; // Reduced from 450
    const margin = 20;  // Reduced from 40
    const radius = Math.min(width, height) / 2 - margin;
    
    // Store reference to this for use in event handlers
    const that = this;
    
    // Track the currently active category
    let activeCategory: string | null = null;

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

    // Build the pie chart with 3D effect
    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius)
      .padAngle(0.02);  // Add space between segments for 3D effect

    // Add the arcs with 3D effect
    svg.selectAll('path')
      .data(pieData)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.category))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .style('filter', 'drop-shadow(0px 3px 3px rgba(0,0,0,0.3))') // 3D shadow effect
      .style('transition', 'transform 0.2s ease-out')
      .on('mouseover', function(event, d) {
        // Calculate percentage
        const total = d3.sum(data, d => d.count);
        const percent = Math.round((d.data.count / total) * 100);
        
        // Reset any previously active segments
        if (activeCategory && activeCategory !== d.data.category) {
          // Restore the previous category label
          svg.selectAll('.pie-label').filter(function(labelData: any) {
            return labelData.data.category === activeCategory;
          }).style('opacity', 1);
          
          // Scale down any previously active segments
          svg.selectAll('path').filter(function(pathData: any) {
            return pathData.data.category === activeCategory;
          })
          .transition()
          .duration(200)
          .style('transform', 'scale(1)')
          .style('opacity', 0.8);
        }
        
        // Remove any existing percentage tooltips
        svg.selectAll('.percent-tooltip').remove();
        
        // Hide the category label when showing percentage
        svg.selectAll('.pie-label').filter(function(labelData: any) {
          return labelData.data.category === d.data.category;
        }).style('opacity', 0);
          
        // Get average yards for this category
        const avgYards = that.getAverageYardsGained(d.data.category);
        
        // Add percentage tooltip
        const tooltip = svg.append('g')
          .attr('class', 'percent-tooltip')
          .attr('text-anchor', 'middle')
          .attr('transform', `translate(${arc.centroid(d)})`);
        
        // Add percentage text
        tooltip.append('text')
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .style('fill', '#fff')
          .style('text-anchor', 'middle')
          .attr('y', -8)
          .text(`${percent}%`);
          
        // Add average yards text
        tooltip.append('text')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', '#fff')
          .style('text-anchor', 'middle')
          .attr('y', 10)
          .text(`${avgYards.toFixed(1)} yds/play`);
        
        // Scale up the pie section
        d3.select(this)
          .transition()
          .duration(200)
          .style('transform', 'scale(1.1)')
          .style('opacity', 1);
          
        // Show concept table for this category
        that.showConceptTable(d.data.category);
        
        // Update the active category
        activeCategory = d.data.category;
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
          
        // We no longer hide the concept table on mouseout
        // The table will remain visible until another segment is hovered
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
  }
}
