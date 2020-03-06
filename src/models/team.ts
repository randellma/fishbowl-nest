import { Player } from "./Player";

export class Team {
    name: string;
    players: Player[];

    constructor(name: string) {
        this.name = name;
        this.players = [];
    }
}