import { Player } from "./player";

export class Team {
    name: string;
    players: Player[];
    
    constructor(name: string) {
        this.name = name;
     }
}