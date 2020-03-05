import { TestingModule, Test } from "@nestjs/testing";
import { AppService } from "./app.service";
import { GameData } from "./data/game.data";
import { Game } from "./models/Game";
import { GameSettings } from "./models/GameSettings";
import { GameState } from "./models/enum/GameState";
import { Team } from "./models/Team";
import { Player } from "./models/Player";
import { Phrase } from "./models/Phrase";

describe('AppService', () => {
    let app: TestingModule;
    let appService: AppService;
    let gameData: GameData;

    function getGenericGame(gameId: string): Game {
        let game = new Game();
        game.id = gameId;
        game.state = GameState.Registration;
        game.lastUpdate = new Date();

        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 3;
        gameSettings.numberOfRounds = 3;
        gameSettings.passesAllowed = 3;
        gameSettings.phraseCharacterLimit = 10;
        gameSettings.timeLimit = 60;
        game.gameSettings = gameSettings;

        let player1 = new Player('p1', 'p1');
        let player2 = new Player('p2', 'p2');
        let team1 = new Team('t1');
        let team2 = new Team('t2');
        team1.players = [player1];
        team2.players = [player2];
        game.teams = [team1, team2];
        game.leader = player1;

        return game;
    }

    //Add games with ids 'g1', 'g2', ...'gn'
    function setupGenericGame(numberOfGames: number) {
        for (let index = 1; index <= numberOfGames; index++) {
            gameData.addGame(getGenericGame(`g${index}`));
        }
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
        game.teams = [new Team('wrongTeam'), new Team('anotherWrongTeam')];
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
        game.teams = [new Team('wrongTeam'), new Team('teamName')];
        game.teams[0].players = [new Player('id', 'player')]
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
        game.teams = [wrongTeam, rightTeam];
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
        game.teams = [wrongTeam, rightTeam];
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
        game.teams = [wrongTeam, rightTeam];
        let player = new Player('id', 'otherPlayer');
        wrongTeam.players = [player]
        game.leader = player;
        gameData.games.set('gameId', game);

        appService.joinGame('gameId', 'player2', 'teamName');

        expect(game.leader).toBeDefined;
        expect(game.leader.name).toBe('otherPlayer');
    });

    test('Non-player trying to subkit phrases throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];


        let result = () => {
            appService.submitPhrases('gameId', 'nonPlayerId', [new Phrase(), new Phrase(), new Phrase()]);
        };

        expect(result).toThrow('Player does not exist');
    });

    test('Submitting fewer than required phrases throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 2;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];


        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase('a')]);
        };

        expect(result).toThrow('Invalid number of phrases submitted. Expected: 2');
    });

    test('Submitting greater than required phrases throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 2;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];

        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase('a'), new Phrase('b'), new Phrase('c')]);
        };

        expect(result).toThrow('Invalid number of phrases submitted. Expected: 2');
    });

    test('Submitting non-unique phrases throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 3;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];

        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase('a'), new Phrase('b'), new Phrase('a')]);
        };

        expect(result).toThrow('All phrases must be unique.');
    });

    test('Submitting null phrases throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 3;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];

        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase(), new Phrase('b'), new Phrase('a')]);
        };

        expect(result).toThrow('All phrases must have a value.');
    });

    test('Submitting blank phrases throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 3;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];

        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase(), new Phrase('b'), new Phrase('a')]);
        };

        expect(result).toThrow('All phrases must have a value.');
    });

    test('Submitting phrases twice throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        let player = new Player('playerId', 'jimThePlayer');
        player.phrasesSubmitted = true;
        team.players = [player];

        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase('a'), new Phrase('ab'), new Phrase('abc')]);
        };

        expect(result).toThrow('jimThePlayer has already submitted phrases.');
    });

    test('Submitting phrases longer than limit throws an exception', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 3;
        gameSettings.phraseCharacterLimit = 2;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        team.players = [new Player('playerId', 'jimThePlayer')];

        let result = () => {
            appService.submitPhrases('gameId', 'playerId', [new Phrase('a'), new Phrase('ab'), new Phrase('abc')]);
        };

        expect(result).toThrow('Phrases must be less than 2 characters.');
    });

    test('Submitting valid phrases is successful and sets the user as having phrases submitted', () => {
        let game = new Game();
        game.id = 'gameId';
        let gameSettings = new GameSettings();
        gameSettings.phraseLimitPerPlayer = 3;
        game.gameSettings = gameSettings;
        gameData.addGame(game);
        let team = new Team('tameName')
        game.teams = [team];
        let player = new Player('playerId', 'jimThePlayer');
        team.players = [player];

        let result = appService.submitPhrases('gameId', 'playerId', [new Phrase('a'), new Phrase('b'), new Phrase('c')]);

        expect(result).toBeDefined();
        expect(result.gameId).toBe('gameId');
        expect(player.phrasesSubmitted).toBe(true);
        expect(game.phrases.length).toBe(3);
        game.phrases.forEach(phrase => {
            expect(phrase.authorName).toBe('jimThePlayer');
        });
    });

    test('getGameData fetches correct player', () => {
        setupGenericGame(1);

        let result1 = appService.getGameData('g1', 'p1');
        let result2 = appService.getGameData('g1', 'p2');

        expect(result1.player).toBeDefined();
        expect(result1.player.id).toBe('p1');

        expect(result2.player).toBeDefined();
        expect(result2.player.id).toBe('p2');
    });

    // test('Game must have all players submit phrases to complete registration', () => {
    //     setupGenericGame(1);

    //     let result = () => {
    //         appService.completeRegistration('g1', 'p1');
    //     };
    //     expect(result).toThrow
    // });

});