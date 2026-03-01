import { Component, signal, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [FormsModule],
  styleUrl: './app.css'
})
export class App {
  title: Signal<string> = signal('Gaming Vibe');
  inputValue = '';
  constructor(private gameService: GameService) {}

  addGame() {
    this.gameService.addGame(this.inputValue);
    this.inputValue = '';
  }

  toggleGame(id: string) {
    this.gameService.toggleGame(id);
  }

  deleteGame(id: string) {
    this.gameService.deleteGame(id);
  }

  get games(): Game[] {
    return this.gameService.getGames();
  }
}
