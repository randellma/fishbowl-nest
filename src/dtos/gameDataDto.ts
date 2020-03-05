import { Team } from 'src/models/Team';
import { Phrase } from "src/models/Phrase";
import { GameState } from 'src/models/enum/GameState';
import { Player } from 'src/models/Player';
import { GameSettings } from 'src/models/GameSettings';
import { Game } from 'src/models/Game';

export class GameDataDto {
  //Properties that should always be mapped.
  gameId: string;
  gameSettings: GameSettings;
  gameState: GameState;
  // Properties that should change based on who is getting the data.
  player: Player;
  phrases: Phrase[];
  currentPlayer: string;
  nextPlayer: string;
}
