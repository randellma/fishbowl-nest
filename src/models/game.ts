import { GameState } from './enum/gameState';
import { Team } from './team';
import { GameMode } from './enum/gameMode';
import { Phrase } from './phrase';
import { GameDataDto } from 'src/dtos/gameDataDto';

export class Game {
  id: string;
  mode: GameMode;
  state: GameState;
  numberOfRounds: number;
  teams: Team[];
  timeLimit: number;
  phraseLimitPerPlayer: number;
  phraseCharacterLimit: number;
  passesAllowed: number;
  phrases: Phrase[];

  constructor() {}
}
