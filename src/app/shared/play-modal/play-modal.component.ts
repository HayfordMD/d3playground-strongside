import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FootballPlay } from '../../models/football-play.model';

@Component({
  selector: 'app-play-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeModal($event)">
      <div class="modal-content" (click)="stopPropagation($event)">
        <div class="modal-header">
          <h2>{{ play?.play_name }}</h2>
          <button class="close-button" (click)="close()">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-content-layout">
            <div class="video-container">
              <!-- Use iframe for YouTube videos -->
              <iframe 
                *ngIf="isYoutubeVideo" 
                [src]="videoUrl" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
              
              <!-- Use video element for local MP4 files -->
              <video 
                *ngIf="!isYoutubeVideo" 
                [src]="videoUrl" 
                controls 
                preload="metadata">
                Your browser does not support the video tag.
              </video>
            </div>
            <div class="play-details">
              <h3>Play Details</h3>
            <table class="details-table">
              <tr>
                <th>Formation:</th>
                <td>{{ play?.play_formation }}</td>
              </tr>
              <tr>
                <th>Concept:</th>
                <td>{{ play?.play_concept }}</td>
              </tr>
              <tr>
                <th>Play Type:</th>
                <td>{{ play?.play_type }}</td>
              </tr>
              <tr>
                <th>Down:</th>
                <td>{{ play?.down }}</td>
              </tr>
              <tr>
                <th>Distance:</th>
                <td>{{ play?.distance }}</td>
              </tr>
              <tr>
                <th>Yards Gained:</th>
                <td [ngClass]="{
                  'positive-yards': play?.yards_gained! > 0,
                  'negative-yards': play?.yards_gained! < 0,
                  'neutral-yards': play?.yards_gained === 0
                }">{{ play?.yards_gained }}</td>
              </tr>
              <tr *ngIf="play?.qtr">
                <th>Quarter:</th>
                <td>{{ play?.qtr }}</td>
              </tr>
              <tr *ngIf="play?.home_team">
                <th>Home Team:</th>
                <td>{{ play?.home_team }}</td>
              </tr>
              <tr *ngIf="play?.away_team">
                <th>Away Team:</th>
                <td>{{ play?.away_team }}</td>
              </tr>
              <tr *ngIf="play?.running_back">
                <th>Running Back:</th>
                <td>{{ play?.running_back }}</td>
              </tr>
              <tr *ngIf="play?.notes">
                <th>Notes:</th>
                <td>{{ play?.notes }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #7f8c8d;
    }

    .close-button:hover {
      color: #2c3e50;
    }

    .modal-body {
      padding: 20px;
    }
    
    .modal-content-layout {
      display: flex;
      flex-direction: row;
      gap: 20px;
      align-items: flex-start;
    }
    
    @media (max-width: 768px) {
      .modal-content-layout {
        flex-direction: column;
      }
    }

    .video-container {
      flex: 0 0 40%;
      position: relative;
      padding-bottom: 22.5%; /* Reduced height (40% of 16:9 aspect ratio) */
      height: 0;
    }

    .video-container iframe, .video-container video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .play-details {
      flex: 1;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
    }

    .details-table th, .details-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .details-table th {
      width: 30%;
      color: #7f8c8d;
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
  `
})
export class PlayModalComponent {
  @Input() isOpen = false;
  @Input() play: FootballPlay | null = null;
  @Output() closeEvent = new EventEmitter<void>();
  
  // Flag to determine if we should use iframe (YouTube) or video element (local MP4)
  isYoutubeVideo = false;

  constructor(private sanitizer: DomSanitizer) {}

  get videoUrl(): SafeResourceUrl {
    // Check if the play has a video_url that's a YouTube link
    if (this.play?.video_url && this.play.video_url.includes('youtube.com')) {
      this.isYoutubeVideo = true;
      return this.sanitizer.bypassSecurityTrustResourceUrl(this.play.video_url);
    }
    
    // For dummy image URLs in the data, use our local video file instead
    if (this.play?.video_url && this.play.video_url.includes('dummyimage.com')) {
      this.isYoutubeVideo = false;
      return this.sanitizer.bypassSecurityTrustResourceUrl('assets/media/video/Wide - Clip 004.mp4');
    }
    
    // Default fallback
    this.isYoutubeVideo = false;
    return this.sanitizer.bypassSecurityTrustResourceUrl('assets/media/video/Wide - Clip 004.mp4');
  }

  close(): void {
    this.isOpen = false;
    this.closeEvent.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  closeModal(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
