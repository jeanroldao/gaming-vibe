var app = angular.module('app', []);

app.service('GameService', function() {
  var games = [];
  this.addGame = function(title) {
    if (!title.trim()) return;
    var newGame = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      completed: false
    };
    games.push(newGame);
  };
  this.toggleGame = function(id) {
    var game = games.find(function(g) { return g.id === id; });
    if (game) game.completed = !game.completed;
  };
  this.deleteGame = function(id) {
    games = games.filter(function(g) { return g.id !== id; });
  };
  this.getGames = function() {
    return games;
  };
});

app.controller('GameController', ['GameService', function(GameService) {
  var vm = this;
  vm.inputValue = '';
  vm.games = GameService.getGames();
  vm.addGame = function() {
    GameService.addGame(vm.inputValue);
    vm.inputValue = '';
  };
  vm.toggleGame = function(id) {
    GameService.toggleGame(id);
  };
  vm.deleteGame = function(id) {
    GameService.deleteGame(id);
  };
}]);
