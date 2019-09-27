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
const fs_1 = require("fs");
const path = require("path");
const csv = require("neat-csv");
const entry_1 = require("./entry");
class UserData {
    constructor(entriesPerPack) {
        this.repsPerEntry = 4;
        this.beganDate = new Date();
        this.entriesPerPack = entriesPerPack;
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
     * @returns {Entry[]} array of entry objects
     */
    createEntriesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let subDirs = UserData.getDirectories();
            let entryMap = new Map();
            let textMaps = yield UserData.createTextMaps(subDirs);
            subDirs.forEach(function (subDir) {
                let subDirEntries = [];
                let audioFiles = UserData.getFilesWithExt(subDir, 'mp3');
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
            this.entries = entryMap;
        });
    }
    static createTextMaps(subDirs) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultMap = new Map();
            const tasks = [];
            subDirs.forEach(function (subDir) {
                tasks.push(UserData.parseCSVAsync(subDir));
            });
            let csvResults = yield Promise.all(tasks);
            csvResults.forEach(function (result) {
                resultMap.set(result[0], result[1]);
            });
            return resultMap;
        });
    }
    static parseCSVAsync(subDir) {
        return __awaiter(this, void 0, void 0, function* () {
            let textMap = new Map();
            let csvFiles = UserData.getFilesWithExt(subDir, 'csv');
            if (csvFiles !== null && csvFiles.length > 0) {
                let csvPath = path.join(__dirname, '..', 'data', subDir, csvFiles[0]);
                let csvInput = yield fs_1.readFileSync(csvPath, 'utf8');
                let csvData = yield csv(csvInput, {
                    headers: ['index', 'sentence'], separator: ',', skipLines: 1
                });
                csvData.forEach(function (row) {
                    textMap.set(`${row['index']}.mp3`, row['sentence']);
                });
            }
            return [subDir, textMap];
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
     * @returns {Pack[]} array of Pack objects
     */
    createPacks() {
        let sources = this.entries.keys();
        return null;
    }
    /**
     * Find and return the next Pack to be presented to the user.
     * If none exists, return null.
     * @returns {Pack} pack object
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
    /**
     * Get list of sub-directory names within data folder.
     * @returns {string[]} array of directory names
     */
    static getDirectories() {
        let dirPath = path.join(__dirname, '..', 'data');
        let dirs = fs_1.readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());
        return dirs.map(dirent => dirent.name);
    }
    /**
     * Get list of filenames with specific extension within specific sub-directory.
     * @param subDir
     * @param extension
     * @returns {string[]} array of filenames
     */
    static getFilesWithExt(subDir, extension) {
        let dirPath = path.join(__dirname, '..', 'data', subDir);
        let files = fs_1.readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);
        return files.filter(name => name.endsWith(extension));
    }
}
exports.UserData = UserData;
//# sourceMappingURL=userData.js.map