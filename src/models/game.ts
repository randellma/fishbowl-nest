import { GameState } from './enum/GameState';
import { Phrase } from "./Phrase";
import { GameSettings } from "./GameSettings";

export class Game {
  id: string;
  gameSettings: GameSettings;
  state: GameState;
  phrases: Phrase[];
  lastUpdate: Date;

  constructor() {
  }
}
