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
const lesson_1 = require("./lesson");
const pack_1 = require("./pack");
const storage_1 = require("../storage");
class UserData {
    constructor() {
        this.beganDate = new Date();
        this.currentLessonIndex = 0;
        this.currentReps = 0;
    }
    getFormattedDateString() {
        let beganDate = new Date(this.beganDate);
        let beganMonth = beganDate.getMonth();
        let beganDay = beganDate.getDay();
        let beganYear = beganDate.getFullYear();
        let began = `${beganMonth}-${beganDay}-${beganYear}`;
        let last = `No days studied`;
        if (this.lastStudiedDate !== null && this.lastStudiedDate !== undefined) {
            let lastDate = new Date(this.lastStudiedDate);
            let lastMonth = lastDate.getMonth();
            let lastDay = lastDate.getDay();
            let lastYear = lastDate.getFullYear();
            last = `${lastMonth}-${lastDay}-${lastYear}`;
        }
        return `Created: ${began} | Last Studied: ${last}`;
    }
    getFormattedSourcesString() {
        return `Sources: ${this.sources.join(', ')}`;
    }
    getFormattedCompletionString() {
        return `${this.getFormattedCompletionPctString()} complete`;
    }
    getFormattedCompletionPctString() {
        return `${this.currentLessonIndex / this.totalLessons}%`;
    }
    /**
     * Iterate across all files in data directory, creating individual entries, packs and lessons.
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
     * @param {number} entriesPerPack: Number of entries per each pack.
     */
    createAsync(entriesPerPack) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sources = storage_1.Storage.getDirectories();
            let entryMap = new Map();
            let textMaps = yield this.createTextMapsAsync();
            let entryCount = 0;
            this.sources.forEach((subDir) => {
                let subDirEntries = [];
                let audioFiles = storage_1.Storage.getFilesWithExt(subDir, 'mp3');
                let textMap = textMaps.get(subDir);
                audioFiles.forEach((fileName) => {
                    let text = null;
                    if (textMap.has(fileName)) {
                        text = textMap.get(fileName);
                    }
                    let newEntry = new entry_1.Entry(path.join(__dirname, '..', 'data', subDir, fileName), text);
                    subDirEntries.push(newEntry);
                });
                entryCount += subDirEntries.length;
                entryMap.set(subDir, subDirEntries);
            });
            this.totalEntries = entryCount;
            let packs = this.createPacks(entryMap, entriesPerPack);
            this.lessons = this.createLessons(packs);
        });
    }
    createTextMapsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let resultMap = new Map();
            const tasks = [];
            this.sources.forEach((subDir) => {
                tasks.push(storage_1.Storage.parseCSVAsync(subDir));
            });
            let csvResults = yield Promise.all(tasks);
            csvResults.forEach((result) => {
                resultMap.set(result[0], result[1]);
            });
            return resultMap;
        });
    }
    /**
     * Assemble all entries into packs of entries of a defined length.
     * Pulls in entries round-robin across sub-directory sources in data folder.
     *
     * @param {Map<string, Entry[]>} entryMap: Map of source name to its Array of Entry objects.
     * @param {number} entriesPerPack: Number of entries per each pack.
     * @returns {Pack[]} Assembled packs.
     */
    createPacks(entryMap, entriesPerPack) {
        let sources = Array.from(this.sources.values());
        let sourceIndexTracker = new Map();
        for (let source of sources) {
            sourceIndexTracker.set(source, 0);
        }
        // Add entries to packs round robin across sources
        let packs = [];
        let usedSourceIdx = 0;
        let assembledPack = [];
        while (sources.length > 0) {
            // Which source to use, and which entry index we are currently on within that source
            if (usedSourceIdx >= sources.length) {
                usedSourceIdx = 0;
            }
            let usedSourceKey = sources[usedSourceIdx];
            let usedSourceEntryIdx = sourceIndexTracker.get(usedSourceKey);
            // If source has run out of available entries, remove it from sources for round robin
            if (usedSourceEntryIdx >= entryMap.get(usedSourceKey).length) {
                sources.splice(usedSourceIdx, 1);
                continue;
            }
            let currentEntry = entryMap.get(usedSourceKey)[usedSourceEntryIdx];
            assembledPack.push(currentEntry);
            // Add new pack once we have enough entries amassed, then clear it
            if (assembledPack.length >= entriesPerPack) {
                packs.push(new pack_1.Pack(assembledPack));
                assembledPack = [];
            }
            // Increment source and source entry index trackers
            sourceIndexTracker.set(usedSourceKey, usedSourceEntryIdx + 1);
            usedSourceIdx++;
        }
        // Add any remaining entries as final pack
        if (assembledPack.length > 0) {
            packs.push(new pack_1.Pack(assembledPack));
        }
        this.totalPacks = packs.length;
        return packs;
    }
    /**
     * Create lessons which represent a day of study for the user. Each lesson contains 5 packs.
     * A lesson is designed to present each entry to the user a certain number of times
     * over the course of a few days to imprint on their memory.
     *
     * Lesson format for first 6 days:
         n-4, n-3, n-2, n-1, n

         -  -  -  -  1
         -  -  -  1  2
         -  -  1  2  3
         -  1  2  3  4
         1  2  3  4  5
         2  3  4  5  6
     *
     * @param {Pack[]} packs: Assembled packs to be put into lessons.
     * @returns {Lesson[]} Assembled lessons.
     */
    createLessons(packs) {
        let lessons = [];
        let previousSeenPacks = [];
        packs.forEach((pack) => {
            let combinedPacks = [pack].concat(previousSeenPacks);
            lessons.push(new lesson_1.Lesson(combinedPacks));
            previousSeenPacks.unshift(pack);
            if (previousSeenPacks.length > 4) {
                previousSeenPacks.pop();
            }
        });
        // Fade out the remaining entries, adding no new ones
        while (previousSeenPacks.length > 1) {
            previousSeenPacks.pop();
            let remainingPacks = [].concat(previousSeenPacks);
            lessons.push(new lesson_1.Lesson(remainingPacks));
        }
        this.totalLessons = lessons.length;
        return lessons;
    }
    /**
     * Find and return the next Lesson to be presented to the user.
     * If none exists, return null.
     *
     * @returns {Lesson} Lesson object.
     */
    getNextLesson() {
        if (this.currentLessonIndex < this.lessons.length) {
            return this.lessons[this.currentLessonIndex];
        }
        else {
            return null;
        }
    }
    /**
     * Update data following the end of a user's training session.
     *
     * @param {number} repsPerEntry: Number of reps per entry the user has defined.
     */
    update(repsPerEntry) {
        let lastLesson = this.lessons[this.currentLessonIndex];
        let seenReps = 0;
        lastLesson.packs.forEach((pack) => {
            seenReps += pack.entries.length;
        });
        this.currentReps += (seenReps * repsPerEntry);
        this.currentLessonIndex++;
        this.lastStudiedDate = new Date();
    }
}
exports.UserData = UserData;
//# sourceMappingURL=userData.js.map