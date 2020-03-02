import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Game } from './models/game';
import { GameDataDto } from './dtos/gameDataDto';
import { GameState } from './models/enum/gameState';
import { Team } from './models/team';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  private getDefaultGameSettings(): Game {
    let game = new Game();
    game.phraseLimitPerPlayer = 3;
    game.phraseCharacterLimit = 150;
    game.teams = [new Team('Team 1'), new Team('Team 2')];
    game.numberOfRounds = 3;
    game.passesAllowed = 3;
    game.timeLimit = 60;
    return game;
  }

  @Get()
  get(@Res() res) {
    let gameId = this.appService.createNewGame(this.getDefaultGameSettings());
    res.redirect(`/api/${gameId}`);
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
  createGame(@Param('game') game: Game): string {
    return this.appService.createNewGame(game);
  }

  @Get('/:gameId')
  joinGame(@Param('gameId') gameId: string): GameDataDto {
    let game = this.appService.getGameById(gameId);
    let gameData = new GameDataDto();
    gameData.gameId = game.id;
    gameData.gameMode = game.mode;
    gameData.gameState = game.state;
    gameData.teams = game.teams;
    return gameData;
  }

  /**
   * Join a game accepting players.
   * @param gameID The Id of the game.
   * @param playerName The name of the player joining. Must be unique.
   */
  @Post('join')
  addPlayer(
    @Param('gameId') gameID: string,
    @Param('playerName') playerName: string,
    @Param('teamName') teamName: string,
  ): GameDataDto {
    return null;
  }
}
