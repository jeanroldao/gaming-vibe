import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [App],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a game via input', () => {
    component.inputValue = 'New game';
    component.addGame();
    expect(component.games.length).toBe(1);
    expect(component.games[0].title).toBe('New game');
  });

  it('should toggle game', () => {
    component.addGame();
    const id = component.games[0].id;
    component.toggleGame(id);
    expect(component.games[0].completed).toBeTrue();
  });

  it('should delete game', () => {
    component.addGame();
    const id = component.games[0].id;
    component.deleteGame(id);
    expect(component.games.length).toBe(0);
  });
});
