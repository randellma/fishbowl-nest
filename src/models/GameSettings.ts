import { GameMode } from './enum/GameMode';
import { Team } from './Team';
export class GameSettings {
  mode: GameMode;
  numberOfRounds: number;
  teams: Team[];
  timeLimit: number;
  phraseLimitPerPlayer: number;
  phraseCharacterLimit: number;
  passesAllowed: number;
}
