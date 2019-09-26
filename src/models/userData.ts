import { readdirSync } from "fs";
import * as path from 'path';

import { Pack} from "./pack";


export class UserData {
    private readonly repsPerEntry: number = 4;
    private readonly packs: Pack[];

    public beganDate: Date;
    public totalEntries: number;
    public entriesPerPack: number;

    public lastStudiedDate: Date;
    public currentPackIndex: number;
    public currentReps: number;


    constructor(entriesPerPack: number) {
        this.beganDate = new Date();
        this.entriesPerPack = entriesPerPack;

        // Find all subdirs in app/data and split the inputs from them by name
        this.totalEntries = 0;
        let subDirs: string[] = UserData.getDirectories();

        // Create new packs, evenly splitting subdir inputs into them
        this.packs = null;
    }

    /**
     * Find and return the next Pack to be presented to the user.
     * If none exists, return null.
     * @returns {Pack}
     */
    public getNextPack(): Pack {
        if (this.currentPackIndex < this.packs.length) {
            return this.packs[this.currentPackIndex];
        } else {
            return null;
        }
    }

    /**
     * Update data following the end of a user's training session.
     */
    public update(): void {
        let lastPack: Pack = this.packs[this.currentPackIndex];
        this.currentReps += lastPack.entries.length * this.repsPerEntry;

        this.currentPackIndex++;
        this.lastStudiedDate = new Date();
    }

    private static getDirectories(): string[] {
        return readdirSync(path.join(__dirname, '..', 'data'), { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }
}
