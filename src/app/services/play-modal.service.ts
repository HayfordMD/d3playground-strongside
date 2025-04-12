import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FootballPlay } from '../models/football-play.model';

@Injectable({
  providedIn: 'root'
})
export class PlayModalService {
  // Modal state
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private playSubject = new BehaviorSubject<FootballPlay | null>(null);

  // Expose as observables
  isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();
  play$: Observable<FootballPlay | null> = this.playSubject.asObservable();

  constructor() {}

  /**
   * Open the modal with the specified play
   * @param play The football play to display in the modal
   */
  openModal(play: FootballPlay): void {
    this.playSubject.next(play);
    this.isOpenSubject.next(true);
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.isOpenSubject.next(false);
  }

  /**
   * Get the current modal open state
   */
  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  /**
   * Get the current play being displayed
   */
  get currentPlay(): FootballPlay | null {
    return this.playSubject.value;
  }
}
