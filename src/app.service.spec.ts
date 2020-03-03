import { TestingModule, Test } from "@nestjs/testing";
import { AppService } from "./app.service";
import { GameData } from "./data/game.data";
import { Game } from "./models/Game";
import { GameSettings } from "./models/GameSettings";
import { GameState } from "./models/enum/GameState";

describe('AppService', () => {
    let app: TestingModule;
    let appService: AppService;
    let gameData: GameData;

    function getGenericGame(): Game {
        let game = new Game();
        let gameSettings = new GameSettings();

        game.id = 'gameId'
        game.state = GameState.Registration;
        game.lastUpdate = new Date();
        game.gameSettings = gameSettings;

        return game;
    }

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [AppService, GameData],
        }).compile();
        appService = app.get<AppService>(AppService);
        gameData = app.get<GameData>(GameData);
    });

    beforeEach(async () => {
        gameData.games = new Map();
    });

    test('getGameDataById throws exception if not found', () => {
        let result = () => {
            appService.getGameDataById('game');
        }
        expect(result).toThrow('No game found with Id: game');
    });

    test('getGameDataById finds the game', () => {
        let game = new Game();
        game.id = 'game';
        gameData.games.set('game', game)
        const result = appService.getGameDataById('game');
        expect(result).toBeDefined();
        expect(result.gameId).toBe('game');
    });

    // test('createNewGame assigns a random 5 character game Id', () => {
    //     let result = appService.createNewGame(new GameSettings());
    //     expect(result).toBeDefined();
    //     expect(result.length).toBe(5);
    // });

});