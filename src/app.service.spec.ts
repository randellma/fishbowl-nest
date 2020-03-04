import { TestingModule, Test } from "@nestjs/testing";
import { AppService } from "./app.service";
import { GameData } from "./data/game.data";
import { Game } from "./models/Game";
import { GameSettings } from "./models/GameSettings";
import { GameState } from "./models/enum/GameState";
import { Logger } from "@nestjs/common";
import { Team } from "./models/Team";
import { Player } from "./models/Player";

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
        };
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

    test('createNewGame sets correct values', () => {
        let result = appService.createNewGame(new GameSettings());
        expect(result).toBeDefined();
        expect(result.length).toBe(5);
        var game = gameData.games.get(result);
        expect(game.state).toBe(GameState.Registration);
        expect(game.lastUpdate).toBeDefined();
        expect(game.gameSettings).toBeDefined();
        expect(game.phrases.length).toBe(0);
    });

    test('createNewGame with null gamesettings throws an exception', () => {
        let result = () => {
            appService.createNewGame(null);
        };

        expect(result).toThrow('Invalid game settings');
    });

    test('joinGame with invalid game id throws an exception', () => {
        let game = new Game();
        game.id = 'notGameId';
        game.state = GameState.Registration;
        gameData.games.set('notGameId', game);

        let result = () => {
            appService.joinGame('gameId', 'player', 'team');
        };

        expect(result).toThrow('No game found with Id: gameId');
    });

    test('joinGame with invalid team name throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        game.state = GameState.Registration;
        game.gameSettings.teams = [new Team('wrongTeam'), new Team('anotherWrongTeam')];
        gameData.games.set('gameId', game);

        let result = () => {
            appService.joinGame('gameId', 'player', 'team');
        };

        expect(result).toThrow('No team found with name: team');
    });

    test('joinGame with existing player name throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        game.state = GameState.Registration;
        game.gameSettings.teams = [new Team('wrongTeam'), new Team('teamName')];
        game.gameSettings.teams[0].players = [new Player('id', 'player')]
        gameData.games.set('gameId', game);

        let result = () => {
            appService.joinGame('gameId', 'player', 'teamName');
        };

        expect(result).toThrow('Player already exists with name: player');
    });

    test('joinGame not in registration state throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        game.state = GameState.TurnInProgress;
        gameData.games.set('gameId', game);

        let result = () => {
            appService.joinGame('gameId', 'player', 'team');
        };

        expect(result).toThrow('This game is not accepting new players');
    });

    test('joinGame with valid inputs adds the new player to the team', () => {
        let game = new Game();
        game.id = 'gameId';
        game.state = GameState.Registration;
        let rightTeam = new Team('teamName')
        let wrongTeam = new Team('wrongTeam')
        game.gameSettings.teams = [wrongTeam, rightTeam];
        wrongTeam.players = [new Player('id', 'otherPlayer')]
        gameData.games.set('gameId', game);

        let result = appService.joinGame('gameId', 'player', 'teamName');

        expect(rightTeam.players.length).toBe(1);
        expect(rightTeam.players[0].name).toBe('player');
        expect(rightTeam.players[0].id.length).toBe(5);
        expect(result).toBeDefined();
        expect(result.length).toBe(5);
    });

    test('First player to join game becomes the leader', () => {
        let game = new Game();
        game.id = 'gameId';
        game.state = GameState.Registration;
        game.leader = null;
        let rightTeam = new Team('teamName')
        let wrongTeam = new Team('wrongTeam')
        game.gameSettings.teams = [wrongTeam, rightTeam];
        wrongTeam.players = [new Player('id', 'otherPlayer')]
        gameData.games.set('gameId', game);

        appService.joinGame('gameId', 'player', 'teamName');

        expect(game.leader).toBeDefined;
        expect(game.leader.name).toBe('player');
    });

    test('Other player to join game do not become the leader', () => {
        let game = new Game();
        game.id = 'gameId';
        game.state = GameState.Registration;
        let rightTeam = new Team('teamName')
        let wrongTeam = new Team('wrongTeam')
        game.gameSettings.teams = [wrongTeam, rightTeam];
        let player = new Player('id', 'otherPlayer');
        wrongTeam.players = [player]
        game.leader = player;
        gameData.games.set('gameId', game);

        appService.joinGame('gameId', 'player2', 'teamName');

        expect(game.leader).toBeDefined;
        expect(game.leader.name).toBe('otherPlayer');
    });

});