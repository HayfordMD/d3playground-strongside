import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * GameDriveChartComponent
 * This component will be used to display a D3.js chart visualizing game drives or related analytics.
 * TODO: Integrate D3.js and bind to football drive data.
 */
@Component({
  selector: 'app-game-drive-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-drive-chart.component.html',
  styleUrls: ['./game-drive-chart.component.scss']
})
export class GameDriveChartComponent implements OnInit {
  // Placeholder for future chart data
  driveData: any[] = [
    { id: 'run-gain', type: 'Run', yards: 7, down: '1st & 10', position: 'Own 12' },
    { id: 'pass-gain', type: 'Pass', yards: 19, down: '2nd & 3', position: 'Own 19', result: '1st Down' },
    { id: 'penalty', type: 'Penalty', yards: -5, down: '1st & 10', position: 'Own 38', result: 'Penalty' },
    { id: 'run-gain-2', type: 'Run', yards: 3, down: '1st & 15', position: 'Own 33' },
    { id: 'pass-gain-2', type: 'Pass', yards: 6, down: '2nd & 12', position: 'Own 36' },
    { id: 'run-gain-3', type: 'Run', yards: 10, down: '3rd & 6', position: 'Own 42', result: '1st Down' },
    { id: 'loss-play', type: 'Run (Loss)', yards: -3, down: '1st & 10', position: 'Opp 48' },
    { id: 'run-gain-4', type: 'Run', yards: 4, down: '2nd & 13', position: 'Opp 45' },
    { id: 'penalty-2', type: 'Penalty', yards: -5, down: '3rd & 9', position: 'Opp 41', result: 'Penalty' },
    { id: 'pass-gain-3', type: 'Pass', yards: 15, down: '3rd & 14', position: 'Opp 46', result: '1st Down' },
    { id: 'loss-play-2', type: 'Run (Loss)', yards: -2, down: '4th & 7', position: 'Opp 31' },
    { id: 'run-gain-5', type: 'Run', yards: 6, down: '4th & 9', position: 'Opp 33' },
    { id: 'pass-gain-4', type: 'Pass', yards: 23, down: '4th & 3', position: 'Opp 27', result: '1st Down' },
    { id: 'run-gain-6', type: 'Run', yards: 10, down: '1st & 10', position: 'Opp 10', result: 'Touchdown' }
  ];
  highlightedPlayId: string | null = null;
  selectedPlay: any | null = null;

  constructor() { }

  ngOnInit(): void {
    // Initialization logic for D3.js chart will go here
  }

  moveToTop(playId: string): void {
    const play = this.driveData.find(play => play.id === playId);
    if (play) {
      this.selectedPlay = { ...play }; // Create a copy to display at the top
      this.highlightedPlayId = playId;
      setTimeout(() => {
        this.highlightedPlayId = null;
      }, 2000); // Highlight for 2 seconds
    }
  }
}
