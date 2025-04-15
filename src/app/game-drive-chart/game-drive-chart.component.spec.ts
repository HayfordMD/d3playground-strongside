import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameDriveChartComponent } from './game-drive-chart.component';

describe('GameDriveChartComponent', () => {
  let component: GameDriveChartComponent;
  let fixture: ComponentFixture<GameDriveChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameDriveChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameDriveChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
