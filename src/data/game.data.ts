import { Injectable } from "@nestjs/common";
import { Game } from "src/models/Game";

@Injectable()
export class GameData {
    games: Map<string, Game> = new Map();

    public addGame(game: Game) {
        this.games.set(game.id, game);
    }
}