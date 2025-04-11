import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YamlDataService, YamlDataResult } from '../services/yaml-data.service';

interface PlayData {
  play_id: string;
  quarter: number;
  time: string;
  down: number;
  distance: number;
  yard_line: number;
  play_type: string;
  formation: string;
  personnel: number;
  concept: string;
  play_name: string;
  ball_carrier: string;
  yards_gained: number;
  result: string;
  scoring_play: boolean;
  notes: string;
}

interface GameData {
  game_id: string;
  week: number;
  home_team: string;
  away_team: string;
  date: string;
  location: string;
  weather: string;
  home_score: number;
  away_score: number;
}

interface SeasonData {
  year: number;
}

interface MacarooEntry {
  seasons: SeasonData;
  games: GameData;
  plays: PlayData;
}

@Component({
  selector: 'app-yaml-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="macaroo-table-container">
      <h2>Macaroo Football Data</h2>
      <div class="file-path-info">
        <span>Data Source: <code>assets/data/simple-football-data.yaml</code></span>
      </div>
      
      <div class="filter-container">
        <span class="filter-label">Filter by Play Type:</span>
        <button 
          class="filter-button" 
          [class.active]="currentFilter === 'all'" 
          (click)="filterData('all')">All</button>
        <button 
          class="filter-button" 
          [class.active]="currentFilter === 'run'" 
          (click)="filterData('run')">Run</button>
        <button 
          class="filter-button" 
          [class.active]="currentFilter === 'pass'" 
          (click)="filterData('pass')">Pass</button>
      </div>

      <div class="loading-message" *ngIf="loading">
        Loading data...
      </div>

      <div class="error-message" *ngIf="error">
        {{ error }}
      </div>

      <div class="table-wrapper" *ngIf="!loading && !error && filteredData.length > 0">
        <table class="macaroo-table">
          <thead>
            <tr>
              <th>Play Name</th>
              <th>Formation</th>
              <th>Concept</th>
              <th>Down</th>
              <th>Distance</th>
              <th>Yards Gained</th>
              <th>Play Type</th>
              <th>Result</th>
              <th>Team</th>
              <th>Opponent</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of filteredData">
              <td>{{ entry.plays.play_name }}</td>
              <td>{{ entry.plays.formation }}</td>
              <td>{{ entry.plays.concept }}</td>
              <td>{{ entry.plays.down }}</td>
              <td>{{ entry.plays.distance }}</td>
              <td [ngClass]="{
                'positive-yards': entry.plays.yards_gained > 0,
                'negative-yards': entry.plays.yards_gained < 0,
                'neutral-yards': entry.plays.yards_gained === 0
              }">{{ entry.plays.yards_gained }}</td>
              <td>{{ entry.plays.play_type }}</td>
              <td>{{ entry.plays.result }}</td>
              <td>{{ entry.games.home_team }}</td>
              <td>{{ entry.games.away_team }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="no-data-message" *ngIf="!loading && !error && filteredData.length === 0">
        No data found for the selected filter.
      </div>
    </div>
  `,
  styles: `
    .macaroo-table-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
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

    .table-wrapper {
      overflow-x: auto;
      margin-top: 20px;
    }

    .macaroo-table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .macaroo-table th, .macaroo-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e1e1e1;
    }

    .macaroo-table th {
      background-color: #2c3e50;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85rem;
    }

    .macaroo-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    .macaroo-table tr:hover {
      background-color: #f1f1f1;
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

    .loading-message, .error-message, .no-data-message {
      text-align: center;
      padding: 20px;
      font-size: 1.1rem;
    }

    .error-message {
      color: #e74c3c;
    }

    .no-data-message {
      color: #7f8c8d;
    }
  `
})
export class YamlDataTableComponent implements OnInit {
  allData: MacarooEntry[] = [];
  filteredData: MacarooEntry[] = [];
  currentFilter: string = 'all';
  loading: boolean = true;
  error: string | null = null;
  filePath: string = '';

  constructor(private yamlDataService: YamlDataService) {}

  ngOnInit(): void {
    this.loadYamlData();
  }

  loadYamlData(): void {
    this.loading = true;
    this.error = null;
    
    this.yamlDataService.loadYamlDataWithPath<MacarooEntry[]>('simple-football-data.yaml')
      .subscribe({
        next: (result: YamlDataResult<MacarooEntry[]>) => {
          console.log('YAML data result:', result);
          if (result.data) {
            this.allData = result.data;
            this.filePath = result.filePath;
            console.log('File path set to:', this.filePath);
            this.filterData(this.currentFilter);
            this.loading = false;
          } else {
            this.error = 'Failed to parse YAML data. Please check the console for details.';
            this.loading = false;
          }
        },
        error: (err: Error) => {
          console.error('Error loading YAML file:', err);
          this.error = 'Failed to load YAML file. Please check the console for details.';
          this.loading = false;
        }
      });
  }

  filterData(filter: string): void {
    this.currentFilter = filter;
    
    if (filter === 'all') {
      this.filteredData = [...this.allData];
    } else {
      this.filteredData = this.allData.filter(entry => 
        entry.plays.play_type.toLowerCase() === filter.toLowerCase()
      );
    }
  }
  
  getDisplayPath(): string {
    console.log('getDisplayPath called, current path:', this.filePath);
    return this.filePath || 'No file path available';
  }
}
