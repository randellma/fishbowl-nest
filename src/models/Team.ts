import { Player } from "./Player";

export class Team {
    name: string;
    players: Player[];
    playerTurnIndex;

    constructor(name: string) {
        this.name = name;
        this.players = [];
        this.playerTurnIndex = 0;
    }
}