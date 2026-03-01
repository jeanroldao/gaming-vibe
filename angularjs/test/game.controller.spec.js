describe('GameController', () => {
  let $controller, vm, GameService;

  beforeEach(module('app'));

  beforeEach(inject(function(_$controller_, _GameService_) {
    $controller = _$controller_;
    GameService = _GameService_;
    vm = $controller('GameController', { GameService: GameService });
  }));

  it('should expose games from service', () => {
    expect(vm.games).toBe(GameService.getGames());
  });

  it('should add game via controller', () => {
    vm.inputValue = 'Ctrl Game';
    vm.addGame();
    expect(vm.games.length).toBe(1);
  });
});
