"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const entry_1 = require("./entry");
const pack_1 = require("./pack");
const storage_1 = require("../storage");
class UserData {
    constructor(entriesPerPack) {
        this.repsPerEntry = 4;
        this.beganDate = new Date();
        this.entriesPerPack = entriesPerPack;
        this.totalPacks = 0;
        this.packs = [];
    }
    /**
     * Iterate across all files in data directory, creating individual entries.
     *
     * Notes:
     *  Organize data files into sub-directories in the data directory. Each of these will be considered a separate 'source'.
     *  Entries from each source will be assembled into packs round-robin style later.
     *
     *  In each sub-directory, there should be no other directories. They should have any number of mp3 files and exqctly one CSV file.
     *  The CSV file format is simple, and I've included a sample at the root of the repo.
     *  Each CSV row should be two columns: the name of the file (without extension), and the text to display for that entry.
     *  The CSV is not required for ach sub-directory. If not found it will be ignored silently.
     *
     * @returns {Entry[]} Array of entry objects.
     */
    createAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let subDirs = storage_1.Storage.getDirectories();
            let entryMap = new Map();
            let textMaps = yield UserData.createTextMapsAsync(subDirs);
            subDirs.forEach(function (subDir) {
                let subDirEntries = [];
                let audioFiles = storage_1.Storage.getFilesWithExt(subDir, 'mp3');
                let textMap = textMaps.get(subDir);
                audioFiles.forEach(function (fileName) {
                    let text = null;
                    if (textMap.has(fileName)) {
                        text = textMap.get(fileName);
                    }
                    let newEntry = new entry_1.Entry(path.join(__dirname, '..', 'data', subDir, fileName), text);
                    subDirEntries.push(newEntry);
                });
                entryMap.set(subDir, subDirEntries);
            });
            this.createPacks(entryMap);
        });
    }
    static createTextMapsAsync(subDirs) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultMap = new Map();
            const tasks = [];
            subDirs.forEach(function (subDir) {
                tasks.push(storage_1.Storage.parseCSVAsync(subDir));
            });
            let csvResults = yield Promise.all(tasks);
            csvResults.forEach(function (result) {
                resultMap.set(result[0], result[1]);
            });
            return resultMap;
        });
    }
    /**
     * Assemble all Entries into daily packs that will be displayed to the user.
     * Pulls in entries round-robin across sub-directory sources in data folder.
     *
     * A pack is designed to present each entry to the user a certain number of times
     * over the course of a few days to imprint on their memory.
     *
     * Pack format for first 6 days:
         n-4, n-3, n-2, n-1, n

         -  -  -  -  1
         -  -  -  1  2
         -  -  1  2  3
         -  1  2  3  4
         1  2  3  4  5
         2  3  4  5  6
     *
     * @param {Map<string, Entry[]>} entryMap: Map of source name to its Array of Entry objects.
     */
    createPacks(entryMap) {
        let sources = Array.from(entryMap.keys());
        let sourceIndexTracker = new Map();
        for (let source of sources) {
            this.totalPacks += entryMap.get(source).length / this.entriesPerPack;
            sourceIndexTracker.set(source, 0);
        }
        // Add 4 to beginning and end to account for fade in and out of entries in sets (see example in doc)
        this.totalPacks += 8;
        // Add entries to packs round robin across sources
        let usedSourceIdx = 0;
        let lastFourEntries = [];
        for (let n = 0; n < this.totalPacks; n++) {
            // Which source to use, and which entry index we are currently on within that source
            if (usedSourceIdx >= sources.length) {
                usedSourceIdx = 0;
            }
            let usedSourceKey = sources[usedSourceIdx];
            let usedSourceEntryIdx = sourceIndexTracker.get(usedSourceKey);
            // Pack is entries n-4, n-3, n-2, n-1, n
            let currentEntry = entryMap.get(usedSourceKey)[usedSourceEntryIdx];
            let entriesForPack = [currentEntry].concat(lastFourEntries);
            this.packs.push(new pack_1.Pack(entriesForPack));
            // Update last four entries
            lastFourEntries.push(currentEntry);
            if (lastFourEntries.length > 4) {
                lastFourEntries.splice(0, 1);
            }
            // Increment source and source entry index trackers
            sourceIndexTracker.set(usedSourceKey, usedSourceEntryIdx + 1);
            usedSourceIdx++;
        }
    }
    /**
     * Find and return the next Pack to be presented to the user.
     * If none exists, return null.
     *
     * @returns {Pack} Pack object.
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
}
exports.UserData = UserData;
//# sourceMappingURL=userData.js.map