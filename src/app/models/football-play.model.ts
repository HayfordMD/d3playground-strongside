export interface FootballPlay {
  id: string;
  play_id: string;
  play_type: string;
  yards_gained: number;
  down: number;
  distance: number;
  play_concept: string;
  play_formation: string;
  play_name: string;
  video_url?: string;
  time?: string;
  qtr?: number;
  home_team?: string;
  away_team?: string;
  running_back?: string;
  notes?: string;
}
