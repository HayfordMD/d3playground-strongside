import { Component, OnInit } from '@angular/core';
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
  selector: 'app-yaml-breakdown',
  standalone: true,
  template: `
    <div class="yaml-breakdown-container">
      <h1>YAML Breakdown Analysis</h1>
      
      <div class="stats-container">
        <div class="stat-card" *ngIf="totalRun !== null">
          <h2>Run Plays</h2>
          <div class="stat-value">{{ totalRun }}</div>
        </div>
        
        <div class="stat-card" *ngIf="totalPass !== null">
          <h2>Pass Plays</h2>
          <div class="stat-value">{{ totalPass }}</div>
        </div>
        
        <div class="stat-card" *ngIf="avgRunYards !== null">
          <h2>Avg Run Yards</h2>
          <div class="stat-value">{{ avgRunYards.toFixed(1) }}</div>
        </div>
        
        <div class="stat-card" *ngIf="avgPassYards !== null">
          <h2>Avg Pass Yards</h2>
          <div class="stat-value">{{ avgPassYards.toFixed(1) }}</div>
        </div>
      </div>
      
      <div class="down-stats">
        <h2>Plays by Down</h2>
        <table class="down-table">
          <thead>
            <tr>
              <th>Down</th>
              <th>Run Plays</th>
              <th>Pass Plays</th>
              <th>Avg Run Yards</th>
              <th>Avg Pass Yards</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let down of [1, 2, 3, 4]">
              <td>{{ down }}</td>
              <td>{{ getRunPlaysByDown(down) }}</td>
              <td>{{ getPassPlaysByDown(down) }}</td>
              <td>{{ getAvgRunYardsByDown(down).toFixed(1) }}</td>
              <td>{{ getAvgPassYardsByDown(down).toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="concepts-container">
        <div class="run-concepts">
          <h2>Run Concepts</h2>
          <table class="concepts-table">
            <thead>
              <tr>
                <th>Concept</th>
                <th>Count</th>
                <th>Avg Yards</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let concept of runConcepts">
                <td>{{ concept.name }}</td>
                <td>{{ concept.count }}</td>
                <td [ngClass]="getYardageClass(concept.avgYards)">{{ concept.avgYards.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pass-concepts">
          <h2>Pass Concepts</h2>
          <table class="concepts-table">
            <thead>
              <tr>
                <th>Concept</th>
                <th>Count</th>
                <th>Avg Yards</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let concept of passConcepts">
                <td>{{ concept.name }}</td>
                <td>{{ concept.count }}</td>
                <td [ngClass]="getYardageClass(concept.avgYards)">{{ concept.avgYards.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .yaml-breakdown-container {
      font-family: 'Arial', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .stats-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      width: 22%;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .stat-card h2 {
      color: #2c3e50;
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    
    .down-stats {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .down-stats h2 {
      color: #2c3e50;
      margin-bottom: 15px;
    }
    
    .down-table, .concepts-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
    }
    
    .down-table th, .down-table td,
    .concepts-table th, .concepts-table td {
      padding: 10px;
      text-align: center;
      border-bottom: 1px solid #e1e1e1;
    }
    
    .down-table th, .concepts-table th {
      background-color: #f1f1f1;
      font-weight: bold;
    }
    
    .concepts-container {
      display: flex;
      justify-content: space-between;
    }
    
    .run-concepts, .pass-concepts {
      width: 48%;
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .run-concepts h2, .pass-concepts h2 {
      color: #2c3e50;
      margin-bottom: 15px;
    }
    
    .good-yardage {
      color: #2ca02c;
      font-weight: bold;
    }
    
    .poor-yardage {
      color: #d62728;
    }
  `],
  imports: [
    // Add CommonModule for ngFor, ngIf, etc.
    // Will need to be imported
  ]
})
export class YamlBreakdownComponent implements OnInit {
  offenseData: OffenseData | null = null;
  
  // Statistics
  totalRun: number | null = null;
  totalPass: number | null = null;
  avgRunYards: number | null = null;
  avgPassYards: number | null = null;
  
  // Concepts data
  runConcepts: { name: string, count: number, avgYards: number }[] = [];
  passConcepts: { name: string, count: number, avgYards: number }[] = [];
  
  // Play data by category
  runPlays: OffensePlay[] = [];
  passPlays: OffensePlay[] = [];
  
  ngOnInit() {
    this.loadYamlData();
  }
  
  private async loadYamlData() {
    try {
      // Load YAML data from assets
      const response = await fetch('assets/data/offenseBreakdown.yaml');
      const yamlText = await response.text();
      const parsedData = yaml.load(yamlText);
      
      // Verify the data structure before assigning
      if (parsedData && typeof parsedData === 'object' && 'offenseBreakdown' in parsedData) {
        this.offenseData = parsedData as OffenseData;
        this.processData();
      } else {
        console.error('Invalid YAML data structure:', parsedData);
      }
    } catch (error) {
      console.error('Error loading YAML data:', error);
    }
  }
  
  private processData() {
    if (!this.offenseData || !this.offenseData.offenseBreakdown) {
      console.error('No valid offense data to process');
      return;
    }
    
    // Process play data
    this.processPlayData();
    
    // Calculate statistics
    this.calculateStatistics();
    
    // Process concepts
    this.processConceptData();
  }
  
  private processPlayData() {
    this.runPlays = [];
    this.passPlays = [];
    
    this.offenseData?.offenseBreakdown.forEach(category => {
      if (!category || !category.category || !category.formations) {
        return;
      }
      
      const plays: OffensePlay[] = [];
      
      category.formations.forEach(formation => {
        if (!formation || !formation.plays) {
          return;
        }
        
        formation.plays.forEach(play => {
          if (!play) {
            return;
          }
          
          plays.push({
            ...play,
            playname: play.playname || `${formation.name || 'Unknown'} ${play.playID || 'Unknown'}`
          });
        });
      });
      
      if (category.category === 'Run') {
        this.runPlays = plays;
      } else if (category.category === 'Pass') {
        this.passPlays = plays;
      }
    });
  }
  
  private calculateStatistics() {
    // Total plays
    this.totalRun = this.runPlays.length;
    this.totalPass = this.passPlays.length;
    
    // Average yards
    this.avgRunYards = this.calculateAverageYards(this.runPlays);
    this.avgPassYards = this.calculateAverageYards(this.passPlays);
  }
  
  private processConceptData() {
    const runConceptMap = new Map<string, { count: number, totalYards: number }>();
    const passConceptMap = new Map<string, { count: number, totalYards: number }>();
    
    this.offenseData?.offenseBreakdown.forEach(category => {
      if (!category || !category.category || !category.formations) {
        return;
      }
      
      const conceptMap = category.category === 'Run' ? runConceptMap : passConceptMap;
      
      category.formations.forEach(formation => {
        if (!formation || !formation.concepts) {
          return;
        }
        
        // Get plays for this formation
        const formationPlays = formation.plays || [];
        
        // Process each concept
        formation.concepts.forEach(concept => {
          if (!concept || !concept.name) {
            return;
          }
          
          const conceptName = concept.name;
          const currentData = conceptMap.get(conceptName) || { count: 0, totalYards: 0 };
          
          // Increment count
          currentData.count += 1;
          
          // Add yards from plays with this concept
          formationPlays.forEach(play => {
            if (play && play.yardsGained) {
              currentData.totalYards += play.yardsGained;
            }
          });
          
          conceptMap.set(conceptName, currentData);
        });
      });
    });
    
    // Convert maps to arrays for template
    this.runConcepts = Array.from(runConceptMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgYards: data.count > 0 ? data.totalYards / data.count : 0
    })).sort((a, b) => b.count - a.count);
    
    this.passConcepts = Array.from(passConceptMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgYards: data.count > 0 ? data.totalYards / data.count : 0
    })).sort((a, b) => b.count - a.count);
  }
  
  private calculateAverageYards(plays: OffensePlay[]): number {
    if (plays.length === 0) return 0;
    
    const totalYards = plays.reduce((sum, play) => sum + (play.yardsGained || 0), 0);
    return totalYards / plays.length;
  }
  
  // Methods for down-specific statistics
  getRunPlaysByDown(down: number): number {
    return this.runPlays.filter(play => play.Down === down).length;
  }
  
  getPassPlaysByDown(down: number): number {
    return this.passPlays.filter(play => play.Down === down).length;
  }
  
  getAvgRunYardsByDown(down: number): number {
    const plays = this.runPlays.filter(play => play.Down === down);
    return this.calculateAverageYards(plays);
  }
  
  getAvgPassYardsByDown(down: number): number {
    const plays = this.passPlays.filter(play => play.Down === down);
    return this.calculateAverageYards(plays);
  }
  
  // Utility method for styling
  getYardageClass(yards: number): string {
    if (yards > 7) return 'good-yardage';
    if (yards < 4) return 'poor-yardage';
    return '';
  }
}
