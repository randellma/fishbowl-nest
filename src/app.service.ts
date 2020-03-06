import { Injectable, BadRequestException } from '@nestjs/common';
import { Game } from './models/Game';
import { GameState } from './models/enum/GameState';
import { GameSettings } from './models/GameSettings';
import { Player } from './models/Player';
import { GameData } from './data/GameData';
import { Phrase } from './models/Phrase';
import { Team } from './models/Team';
import { GameDataDto } from './dtos/GameDataDto';

@Injectable()
export class AppService {

  constructor(private readonly gameData: GameData) { }

  /**
   * The primary game loop method to fetch game data for each player.
   */
  public getGameData(gameId: string, playerId: string): GameDataDto {
    let game = this.getGameById(gameId);
    let gameData = this.getBaseGameDataDto(game);
    let player = this.findPlayerInGame(game, playerId);
    gameData.player = player;
    return gameData;
  }

  public createNewGame(gameSettings: GameSettings): string {
    if (!gameSettings) {
      throw new BadRequestException('Invalid game settings');
    }
    let game = new Game();
    game.id = this.getRandomString();
    game.teams = [new Team('Team_1'), new Team('Team_2')];
    game.gameSettings = gameSettings;
    game.state = GameState.Registration;
    this.gameData.games.set(game.id, game);
    return game.id;
  }

  public joinGame(gameId: string, playerName: string, teamName: string): string {
    let game = this.getGameById(gameId);
    if (game.state != GameState.Registration) {
      throw new BadRequestException('This game is not accepting new players');
    }
    let team = game.teams.find(team => team.name == teamName);
    if (team == null) {
      throw new BadRequestException(`No team found with name: ${teamName}`);
    }
    let existingPlayer = game.teams
      .some(team => team.players.some(player => player.name == playerName));

    if (existingPlayer) {
      throw new BadRequestException(`Player already exists with name: ${playerName}`);
    }
    let player = new Player(this.getRandomString(), playerName);
    team.players.push(player);
    if (game.leader == null) {
      game.leader = player;
    }
    return player.id;
  }

  public submitPhrases(gameId: string, playerId: string, phrases: Phrase[]): GameDataDto {
    let game = this.getGameById(gameId);
    let player = this.findPlayerInGame(game, playerId);
    this.validatePhraseData(player, game.gameSettings, phrases);
    player.phrasesSubmitted = true;
    phrases.forEach(phrase => {
      phrase.authorName = player.name;
      game.phrases.push(phrase);
    });

    return this.getGameData(gameId, playerId);
  }

  private validatePhraseData(player: Player, gameSettings: GameSettings, phrases: Phrase[]) {
    // Check player exists
    if (player == null) {
      throw new BadRequestException('Player does not exist');
    }
    // Check player hasn't already submitted phrases
    if (player.phrasesSubmitted) {
      throw new BadRequestException(`${player.name} has already submitted phrases.`);
    }
    // Check required number
    if (phrases.length != gameSettings.phraseLimitPerPlayer) {
      throw new BadRequestException(`Invalid number of phrases submitted. Expected: ${gameSettings.phraseLimitPerPlayer}`);
    }
    // Check all phrases unique
    phrases.forEach(phrase => {
      // Uniqueness
      if (phrases.some(e => e.phrase == phrase.phrase && e !== phrase)) {
        throw new BadRequestException('All phrases must be unique.');
      }
      if (phrase.phrase == null || phrase.phrase == "") {
        throw new BadRequestException('All phrases must have a value.');
      }
      if (phrase.phrase.length > gameSettings.phraseCharacterLimit) {
        throw new BadRequestException(`Phrases must be less than ${gameSettings.phraseCharacterLimit} characters.`);
      }
    });
  }

  public getGameDataById(gameId: string): GameDataDto {
    return this.getBaseGameDataDto(this.getGameById(gameId));
  }

  public completeRegistration(gameId: string, playerId: string) {
    let game = this.getGameById(gameId);
    this.validateRegistrationCompletion(game, playerId);
  }

  private validateRegistrationCompletion(game: Game, playerId: string) {
    // Check game in registration state
    if (game.state != GameState.Registration) {
      throw new BadRequestException('Game setup is already complete.');
    }
    // Check that the leader is requesting the registration completion
    if (game.leader.id != playerId) {
      throw new BadRequestException(`The game leader must close registration: ${game.leader.name}`);
    }
    // Check all players have submitted phrases
    game.teams.find(team => team.players.find(player => player.phrasesSubmitted != true) != null)
  }


  // Private Methods

  private findPlayerInGame(game: Game, playerId: string) {
    return game.teams.map(team => team.players.find(player => player.id == playerId)).find(e => e != null);
  }

  private getGameById(gameId: string): Game {
    const game = this.gameData.games.get(gameId);
    if (game == null) {
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
