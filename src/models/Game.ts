import { GameState } from './enum/GameState';
import { Phrase } from "./Phrase";
import { GameSettings } from "./GameSettings";
import { Player } from './Player';
import { Team } from './Team';

export class Game {
  id: string;
  gameSettings: GameSettings;
  state: GameState;
  teams: Team[];
  phrases: Phrase[];
  lastUpdate: Date;
  leader: Player;

  turnIndex: number;

  constructor() {
    this.lastUpdate = new Date();
    this.phrases = [];
    this.gameSettings = new GameSettings();
    this.turnIndex = 0;
  }
}
