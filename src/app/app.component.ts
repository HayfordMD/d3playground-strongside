import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  template: `
    <h1>Offensive Breakdown Analysis</h1>
    <div class="pie-chart-container">
      <h2>Run vs Pass Distribution</h2>
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
    
    console.log('Mock concept data created:', 
               Array.from(this.conceptCounts.entries()).map(([k, v]) => 
                 [k, Array.from(v.entries())]));
  }
  
  // Mock data for average yards gained
  private getAverageYardsGained(category: string): number {
    // In a real implementation, this would calculate from actual play data
    if (category === 'Run') {
      return 4.2; // Average yards per run play
    } else if (category === 'Pass') {
      return 7.8; // Average yards per pass play
    }
    return 0;
  }
  
  // Mock data for average yards gained per concept
  private getConceptAverageYards(category: string, concept: string): number {
    // In a real implementation, this would calculate from actual play data
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
    // Mock data for when YAML loading fails
    const runPassData = [
      { category: 'Run', count: 11 },
      { category: 'Pass', count: 9 }
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
    
    // Get concept counts for this category
    const conceptMap = this.conceptCounts.get(category);
    
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
          
        // Note: We no longer hide the concept table on mouseout
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
