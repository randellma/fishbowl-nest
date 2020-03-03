import {
  Controller,
  Get,
  Param,
  Post,
  Res
} from '@nestjs/common';
import { AppService } from './app.service';
import { GameDataDto } from './dtos/GameDataDto';
import { Team } from './models/Team';
import { GameSettings } from './models/GameSettings';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) { }

  private getDefaultGameSettings(): GameSettings {
    let gameSettings = new GameSettings();
    gameSettings.phraseLimitPerPlayer = 3;
    gameSettings.phraseCharacterLimit = 150;
    gameSettings.teams = [new Team('Team_1'), new Team('Team_2')];
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

  @Get('/:gameId')
  getGameInfo(@Param('gameId') gameId: string): GameDataDto {
    return this.appService.getGameDataById(gameId);
  }

  /**
   * Join a game that is accepting players.
   * @param gameID The Id of the game.
   * @param playerName The name of the player joining. Must be unique.
   */
  @Post('join')
  addPlayer(
    @Param('gameId') gameId: string,
    @Param('playerName') playerName: string,
    @Param('teamName') teamName: string,
    @Res() res
  ) {
    let gameData = this.appService.joinGame(gameId, playerName, teamName);
    //TODO: remove redirect and return game data instead
    res.redirect(`/api/${gameId}`);
  }
}
