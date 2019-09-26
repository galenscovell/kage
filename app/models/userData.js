"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = require("path");
class UserData {
    constructor(entriesPerPack) {
        this.repsPerEntry = 4;
        this.beganDate = new Date();
        this.entriesPerPack = entriesPerPack;
        // Find all subdirs in app/data and split the inputs from them by name
        this.totalEntries = 0;
        let subDirs = this.getDirectories();
        console.dir(subDirs);
        // Create new packs, evenly splitting subdir inputs into them
        this.packs = null;
    }
    /**
     * Find and return the next Pack to be presented to the user.
     * If none exists, return null.
     * @returns {Pack}
     */
    getNextPack() {
        if (this.currentPackIndex < this.packs.length) {
            return this.packs[this.currentPackIndex];
        }
        else {
            return null;
        }
    }
    /**
     * Update data following the end of a user's training session.
     */
    update() {
        let lastPack = this.packs[this.currentPackIndex];
        this.currentReps += lastPack.entries.length * this.repsPerEntry;
        this.currentPackIndex++;
        this.lastStudiedDate = new Date();
    }
    getDirectories() {
        return fs_1.readdirSync(path.join(__dirname, '..', 'data'), { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }
}
exports.UserData = UserData;
//# sourceMappingURL=userData.js.map