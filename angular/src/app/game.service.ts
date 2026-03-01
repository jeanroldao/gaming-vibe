import { Injectable } from '@angular/core';

export interface Game {
  id: string;
  title: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private games: Game[] = [];

  addGame(title: string) {
    if (!title.trim()) return;
    const newGame: Game = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      completed: false,
    };
    this.games.push(newGame);
  }

  toggleGame(id: string) {
    const game = this.games.find((g) => g.id === id);
    if (game) {
      game.completed = !game.completed;
    }
  }

  deleteGame(id: string) {
    this.games = this.games.filter((g) => g.id !== id);
  }

  getGames(): Game[] {
    return this.games;
  }
}
