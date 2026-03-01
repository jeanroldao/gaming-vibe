import { TestBed } from '@angular/core/testing';
import { GameService, Game } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('should add a game', () => {
    service.addGame('Test');
    const games = service.getGames();
    expect(games.length).toBe(1);
    expect(games[0].title).toBe('Test');
  });

  it('should toggle completion', () => {
    service.addGame('Test');
    const id = service.getGames()[0].id;
    service.toggleGame(id);
    expect(service.getGames()[0].completed).toBeTrue();
  });

  it('should delete a game', () => {
    service.addGame('Test');
    const id = service.getGames()[0].id;
    service.deleteGame(id);
    expect(service.getGames().length).toBe(0);
  });
});
