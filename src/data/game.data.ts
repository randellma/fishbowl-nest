import { Injectable } from "@nestjs/common";
import { Game } from "src/models/Game";

@Injectable()
export class GameData {
    games: Map<string, Game> = new Map();
}