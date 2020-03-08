import { TestingModule, Test } from "@nestjs/testing";
import { AppService } from "./app.service";
import { GameData } from "./data/GameData";
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

    // Helpers
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

    // Add games with ids 'g1', 'g2', ...'gn'
    function setupGenericGame(numberOfGames: number) {
        for (let index = 1; index <= numberOfGames; index++) {
            gameData.addGame(getGenericGame(`g${index}`));
        }
    }

    //Game Data Loop

    test('getGameDataById throws exception if game not found', () => {
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

    test('getGameData fetches correct player', () => {
        setupGenericGame(1);

        let result1 = appService.getGameData('g1', 'p1');
        let result2 = appService.getGameData('g1', 'p2');

        expect(result1.player).toBeDefined();
        expect(result1.player.id).toBe('p1');

        expect(result2.player).toBeDefined();
        expect(result2.player.id).toBe('p2');
    });

    // Create New Games

    test('createNewGame sets correct values', () => {
        let result = appService.createNewGame(new GameSettings(), ['Team_1', 'Team_2']);
        expect(result).toBeDefined();
        expect(result.length).toBe(5);
        var game = gameData.games.get(result);
        expect(game.state).toBe(GameState.Registration);
        expect(game.lastUpdate).toBeDefined();
        expect(game.gameSettings).toBeDefined();
        expect(game.phrases.length).toBe(0);
        expect(game.turnIndex).toBe(-1);
        game.teams.forEach(team => expect(team.playerTurnIndex).toBe(0));
    });

    test('createNewGame with null gamesettings throws an exception', () => {
        let result = () => {
            appService.createNewGame(null, []);
        };

        expect(result).toThrow('Invalid game settings.');
    });

    test('createNewGame with no team names thows an exception', () => {
        let result = () => {
            appService.createNewGame(new GameSettings(), []);
        };

        expect(result).toThrow('At least one team must be specified.');
    });

    // Joining games

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

    // Submitting Phrases

    test('Non-player trying to submit phrases throws an exception', () => {
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

    // Completing Registration

    test('Game must be in registration status to complete registration', () => {
        setupGenericGame(1);
        gameData.games.get('g1').state = GameState.TurnReady;
        let result = () => {
            appService.completeRegistration('g1', 'p1');
        };
        expect(result).toThrow("Game setup is already complete.");
    });

    test('Game leader must complete registration', () => {
        setupGenericGame(1);
        let leader = new Player('pi3', 'pn3');
        gameData.games.get('g1').leader = leader;
        let result = () => {
            appService.completeRegistration('g1', 'p1');
        };
        expect(result).toThrow("The game leader must close registration: pn3");
    });

    test('All players submit phrases to complete game registration', () => {
        setupGenericGame(1);

        let result = () => {
            appService.completeRegistration('g1', 'p1');
        };
        expect(result).toThrow("Some players have not submitted their phrases: p1, p2");
    });

    test('Completing registration moves game to TURN_READY state', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.teams.forEach(t => t.players.forEach(p => p.phrasesSubmitted = true));

        appService.completeRegistration('g1', 'p1');

        expect(game.state).toBe(GameState.TurnReady);
        expect(game.turnIndex).toBe(-1);
        game.teams.forEach(team => expect(team.playerTurnIndex).toBe(0));
    });

    // Start Turn


    test('Only nextPlayer may start the next turn', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.teams.forEach(t => t.players.forEach(p => p.phrasesSubmitted = true));

        let result = () => {
            appService.startTurn('g1', 'p2');
        };

        expect(result).toThrow("Only the next player may start the turn: p1");
    });


    // Game Data Static Methods
    test('getPlayerAtTurnOffset - A -1 turnIndex with no offset returns a null current player. (The game has not begun)', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = -1;
        expect(AppService.getPlayerAtTurnOffset(game)).toBeNull;
    });

    test('getPlayerAtTurnOffset- A 0 turnIndex with no offset returns the appropriate player from that team', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = 0; // making it team 1's turn
        let team = game.teams[0];
        team.playerTurnIndex = 0; // making it player 2's turn

        let playerAtOffset = AppService.getPlayerAtTurnOffset(game);

        expect(playerAtOffset).toBeDefined();
        expect(playerAtOffset.name).toBe('p1');
    });

    test('getPlayerAtTurnOffset- A team index greater than teams.length returns correct team', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = 5; // making it team 2's turn

        let playerAtOffset = AppService.getPlayerAtTurnOffset(game);

        expect(playerAtOffset).toBeDefined();
        expect(playerAtOffset.name).toBe('p2');
    });

    test('getPlayerAtTurnOffset- A player index higher than players.length returns correct player', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = 1; // making it team 2's turn
        let team = game.teams[1];
        team.playerTurnIndex = 6; // making it player 4's turn
        team.players.push(new Player('p3', 'p3'));
        team.players.push(new Player('p4', 'p4'));
        team.players.push(new Player('p5', 'p5'));

        let playerAtOffset = AppService.getPlayerAtTurnOffset(game);

        expect(playerAtOffset).toBeDefined();
        expect(playerAtOffset.name).toBe('p4');
    });

    test('getPlayerAtTurnOffset - Supplying a 1 offset with -1 teamIndex adjusts team/player index appropriately', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = -1; // making it team 1's turn "next"
        let team = game.teams[0];
        team.playerTurnIndex = 0; // making it player 1's turn "next"

        let playerAtOffset = AppService.getPlayerAtTurnOffset(game, 1);

        expect(playerAtOffset).toBeDefined();
        expect(playerAtOffset.name).toBe('p1');
    });

    test('getPlayerAtTurnOffset - Supplying a > teamsize offset with -1 teamIndex adjusts team/player index appropriately', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = -1; // making it team 1's turn with 5 offset
        let team = game.teams[0];
        team.playerTurnIndex = 0; // making it player 1's turn "next"
        team.players.push(new Player('p3', 'p3'));
        team.players.push(new Player('p4', 'p4'));
        team.players.push(new Player('p5', 'p5'));

        let playerAtOffset = AppService.getPlayerAtTurnOffset(game, 5);

        expect(playerAtOffset).toBeDefined();
        expect(playerAtOffset.name).toBe('p4');
    });

    test('getPlayerAtTurnOffset - walking through initial offsets returns correct player sequence', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = 0; // making it team 1's current turn
        let team1 = game.teams[0];
        let team2 = game.teams[1];
        team1.playerTurnIndex = 0;
        team2.playerTurnIndex = 0;
        team1.players.push(new Player('p3', 'p3'));
        team2.players.push(new Player('p4', 'p4'));
        team1.players.push(new Player('p5', 'p5'));
        team2.players.push(new Player('p6', 'p6'));
        team2.players.push(new Player('p7', 'p7'));

        // expecting 1, 2, 3, 4, 5, 6, 1, 7, 3, 2
        expect(AppService.getPlayerAtTurnOffset(game, 0).name).toBe('p1');
        expect(AppService.getPlayerAtTurnOffset(game, 1).name).toBe('p2');
        expect(AppService.getPlayerAtTurnOffset(game, 2).name).toBe('p3');
        expect(AppService.getPlayerAtTurnOffset(game, 3).name).toBe('p4');
        expect(AppService.getPlayerAtTurnOffset(game, 4).name).toBe('p5');
        expect(AppService.getPlayerAtTurnOffset(game, 5).name).toBe('p6');
        expect(AppService.getPlayerAtTurnOffset(game, 6).name).toBe('p1');
        expect(AppService.getPlayerAtTurnOffset(game, 7).name).toBe('p7');
        expect(AppService.getPlayerAtTurnOffset(game, 8).name).toBe('p3');
        expect(AppService.getPlayerAtTurnOffset(game, 9).name).toBe('p2');
    });

    test('getPlayerAtTurnOffset - walking through progressed offsets returns correct player sequence', () => {
        setupGenericGame(1);
        let game = gameData.games.get('g1');
        game.turnIndex = 6; // making it team 1's current turn
        let team1 = game.teams[0];
        let team2 = game.teams[1];
        team1.playerTurnIndex = 10;
        team2.playerTurnIndex = 10;
        team1.players.push(new Player('p3', 'p3'));
        team2.players.push(new Player('p4', 'p4'));
        team1.players.push(new Player('p5', 'p5'));
        team2.players.push(new Player('p6', 'p6'));
        team2.players.push(new Player('p8', 'p8'));

        // expecting 1, 2, 3, 4, 5, 6, 1, 7, 3, 2
        expect(AppService.getPlayerAtTurnOffset(game, 0).name).toBe('p3');
        expect(AppService.getPlayerAtTurnOffset(game, 1).name).toBe('p6');
        expect(AppService.getPlayerAtTurnOffset(game, 2).name).toBe('p5');
        expect(AppService.getPlayerAtTurnOffset(game, 3).name).toBe('p8');
        expect(AppService.getPlayerAtTurnOffset(game, 4).name).toBe('p1');
        expect(AppService.getPlayerAtTurnOffset(game, 5).name).toBe('p2');
        expect(AppService.getPlayerAtTurnOffset(game, 6).name).toBe('p3');
        expect(AppService.getPlayerAtTurnOffset(game, 7).name).toBe('p4');
        expect(AppService.getPlayerAtTurnOffset(game, 8).name).toBe('p5');
        expect(AppService.getPlayerAtTurnOffset(game, 9).name).toBe('p6');
    });

});