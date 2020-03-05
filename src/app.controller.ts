import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  Body
} from '@nestjs/common';
import { AppService } from './app.service';
import { GameDataDto } from './dtos/GameDataDto';
import { Team } from './models/Team';
import { GameSettings } from './models/GameSettings';
import { Phrase } from './models/Phrase';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) { }

  private getDefaultGameSettings(): GameSettings {
    let gameSettings = new GameSettings();
    gameSettings.phraseLimitPerPlayer = 3;
    gameSettings.phraseCharacterLimit = 150;
    gameSettings.numberOfRounds = 3;
    gameSettings.passesAllowed = 3;
    gameSettings.timeLimit = 60;
    return gameSettings;
  }

  @Get()
  get(): string {
    let gameId = this.appService.createNewGame(this.getDefaultGameSettings());
    //TODO: just return the id of the game and let front end redirect if it wants to
    return gameId;
  }

  /**
   * The main route for players to get the current status of the game for them.
   * @param gameId The Id of the game being played.
   * @param userId The Id of the user requesting the game data.
   */
  @Get('/:gameId/:userId')
  getGameData(
    @Param('gameId') gameId: string,
    @Param('userId') userId: string,
  ): GameDataDto {
    return this.appService.getGameData(gameId, userId);
  }

  /**
   * Create a game with given settings and redirect to its Id to join.
   */
  @Post('create')
  createGame(@Param('game') gameSettings: GameSettings): string {
    return this.appService.createNewGame(gameSettings);
  }

  /**
   * Get game info needed to join for a known game id.
   * @param gameId The known game id.
   */
  @Get('/:gameId')
  getGameInfo(@Param('gameId') gameId: string): GameDataDto {
    return this.appService.getGameDataById(gameId);
  }

  /**
   * Join a game that is accepting players.
   * @param gameID The Id of the game.
   * @param playerName The name of the player joining. Must be unique.
   */
  @Post(':gameId/:teamName/:playerName/join')
  joinGame(
    @Param('gameId') gameId: string,
    @Param('teamName') teamName: string,
    @Param('playerName') playerName: string
  ): string {
    return this.appService.joinGame(gameId, playerName, teamName);
  }

  /**
   * Submit phrases created by the player.
   * @param gameID The Id of the game.
   * @param playerName The name of the player joining. Must be unique.
   * @param playerId The phrases to be submitted.
   */
  @Post(':gameId/:playerId/submitPhrases')
  submitPhrases(
    @Param('gameId') gameId: string,
    @Param('playerId') playerId: string,
    @Body() phrases: Phrase[]
  ): GameDataDto {
    return this.appService.submitPhrases(gameId, playerId, phrases);
  }
}
