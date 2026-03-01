describe('GameService', () => {
  let GameService;

  beforeEach(module('app'));

  beforeEach(inject(function(_GameService_) {
    GameService = _GameService_;
  }));

  it('should add a game', () => {
    GameService.addGame('Test');
    expect(GameService.getGames().length).toBe(1);
    expect(GameService.getGames()[0].title).toBe('Test');
  });

  it('should toggle game', () => {
    GameService.addGame('Test');
    const id = GameService.getGames()[0].id;
    GameService.toggleGame(id);
    expect(GameService.getGames()[0].completed).toBe(true);
  });

  it('should delete game', () => {
    GameService.addGame('Test');
    const id = GameService.getGames()[0].id;
    GameService.deleteGame(id);
    expect(GameService.getGames().length).toBe(0);
  });
});
