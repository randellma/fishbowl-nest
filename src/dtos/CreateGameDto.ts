import { GameSettings } from "src/models/GameSettings";

export class CreateGameDto {
    gameSettings: GameSettings;
    teamNames: string[];
}