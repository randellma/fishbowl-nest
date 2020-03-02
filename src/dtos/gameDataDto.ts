import { Team } from 'src/models/team';
import { Phrase } from 'src/models/phrase';
import { GameState } from 'src/models/enum/gameState';
import { GameMode } from 'src/models/enum/gameMode';
import { Player } from 'src/models/player';

export class GameDataDto {
  gameId: string;
  teams: Team[];
  phrases: Phrase[];
  gameState: GameState;
  gameMode: GameMode;
  currentPlayer: Player;
  nextPlayer: Player;
  lastUpdate: Date;
}
