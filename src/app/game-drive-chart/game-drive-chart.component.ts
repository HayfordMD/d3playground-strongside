import { Component, OnInit, AfterViewInit } from '@angular/core';
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
export class GameDriveChartComponent implements AfterViewInit {
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
  optionsMenuOpenForPlayId: string | null = null;
  toastMessage: string | null = null;

  private width: number = 900;
  private height: number = 600;
  private margin = { top: 60, right: 30, bottom: 60, left: 240 };
  private possessionWidth: number = 40;
  private fieldHeight: number = 400;
  private fieldWidth: number = 800;
  private yardlineLabels: string[] = ['','10','20','30','40','50','40','30','20','10',''];
  private yardlineValues: number[] = [0,10,20,30,40,50,60,70,80,90,100];
  public opponents: string[] = ['Opponent 1', 'Opponent 2', 'Opponent 3', 'Opponent 4', 'Opponent 5', 'Opponent 6', 'Opponent 7', 'Opponent 8', 'Opponent 9', 'Opponent 10'];
  public games: string[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'];
  public selectedOpponent: string = 'Opponent 1';
  public selectedGame: string = 'Week 1';

  constructor() { }

  ngAfterViewInit(): void {
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

  toggleOptionsMenu(playId: string): void {
    this.optionsMenuOpenForPlayId = this.optionsMenuOpenForPlayId === playId ? null : playId;
  }

  playVideo(playId: string): void {
    // Placeholder for video playback logic
    console.log(`Play video for play ID: ${playId}`);
    this.toastMessage = "Play video";
    setTimeout(() => {
      this.toastMessage = null;
    }, 2000); // Show toast for 2 seconds
    // Future implementation could open a video player or modal with the associated video
  }

  onOpponentChange(event: Event): void {
    console.log('Selected opponent:', this.selectedOpponent);
    // TODO: Implement logic to update chart based on selected opponent
  }

  onGameChange(event: Event): void {
    console.log('Selected game:', this.selectedGame);
    // TODO: Implement logic to update chart based on selected game
  }
}
