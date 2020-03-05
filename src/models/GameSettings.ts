import { GameMode } from './enum/GameMode';
export class GameSettings {
  mode: GameMode;
  numberOfRounds: number;
  timeLimit: number;
  phraseLimitPerPlayer: number;
  phraseCharacterLimit: number;
  passesAllowed: number;
}
