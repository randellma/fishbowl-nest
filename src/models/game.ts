import { GameState } from './enum/GameState';
import { Phrase } from "./Phrase";
import { GameSettings } from "./GameSettings";
import { Player } from './Player';

export class Game {
  id: string;
  gameSettings: GameSettings;
  state: GameState;
  phrases: Phrase[];
  lastUpdate: Date;
  leader: Player;

  constructor() {
    this.lastUpdate = new Date();
    this.phrases = [];
    this.gameSettings = new GameSettings();
  }
}
