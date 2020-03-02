import { Injectable, BadRequestException } from '@nestjs/common';
import { Game } from './models/game';
import { GameDataDto } from './dtos/gameDataDto';
import { GameMode } from './models/enum/gameMode';
import { GameState } from './models/enum/gameState';

@Injectable()
export class AppService {
  private games: Map<string, Game> = new Map();

  /**
   * The primary game loop method to fetch game data for each player.
   */
  getGameData(gameId: string, playerId: string): GameDataDto {
    let game = this.getGameById(gameId);
    return null;
  }

  createNewGame(game: Game): string {
    if (game.id) {
      throw new BadRequestException(`This game already exists: ${game.id}`);
    }
    game.id = this.getRandomString();
    game.mode = GameMode.IndividualDevices;
    game.state = GameState.Registration;
    this.games.set(game.id, game);
    return game.id;
  }

  getGames(): Game[] {
    let game = new Game();
    game.id = this.getRandomString();
    this.games.set(game.id, game);
    return Array.from(this.games.values());
  }

  getGameById(gameId: string): Game {
    const game = this.games.get(gameId);
    if (!game) {
      throw new BadRequestException(`No game found with Id: ${gameId}`);
    }
    return game;
  }

  private getRandomString() {
    return Math.random()
      .toString(36)
      .substr(2, 5);
  }
}
