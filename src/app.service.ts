import { Injectable, BadRequestException } from '@nestjs/common';
import { Game } from './models/Game';
import { GameDataDto } from './dtos/GameDataDto';
import { GameMode } from './models/enum/GameMode';
import { GameState } from './models/enum/GameState';
import { GameSettings } from './models/GameSettings';
import { Player } from './models/Player';
import { GameData } from './data/game.data';

@Injectable()
export class AppService {

  constructor(private readonly gameData: GameData) {}

  /**
   * The primary game loop method to fetch game data for each player.
   */
  public getGameData(gameId: string, playerId: string): GameDataDto {
    let game = this.getGameById(gameId);
    return this.getBaseGameDataDto(game);
  }

  public createNewGame(gameSettings: GameSettings): string {
    let game = new Game();
    game.id = this.getRandomString();
    game.gameSettings = gameSettings;
    game.state = GameState.Registration;
    this.gameData.games.set(game.id, game);
    return game.id;
  }

  public joinGame(gameId: string, playerName: string, teamName: string): GameDataDto {
    let game = this.getGameById(gameId);
    let team = game.gameSettings.teams.find(team => team.name == teamName)
    if (!team) {
      throw new BadRequestException(`No team found with Id: ${teamName}`);
    }
    let existingPlayer = game.gameSettings.teams
      .some(team => team.players.some(player => player.name == playerName));
    if (existingPlayer) {
      throw new BadRequestException(`Player already exists with name: ${playerName}`);
    }
    let player = new Player(this.getRandomString(), playerName);
    team.players.push(player);
    return this.getBaseGameDataDto(game);
  }

  public getGameDataById(gameId: string): GameDataDto {
    return this.getBaseGameDataDto(this.getGameById(gameId));
  }

  private getGameById(gameId: string): Game {
    const game = this.gameData.games.get(gameId);
    if (!game) {
      throw new BadRequestException(`No game found with Id: ${gameId}`);
    }
    return game;
  }

  private getBaseGameDataDto(game: Game): GameDataDto {
    let gameData = new GameDataDto();
    gameData.gameId = game.id;
    gameData.gameSettings = game.gameSettings;
    gameData.gameState = game.state;
    return gameData;
  }

  private getRandomString() {
    return Math.random()
      .toString(36)
      .substr(2, 5);
  }
}
