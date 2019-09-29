import * as path from 'path';

import {Entry} from './entry';
import {Lesson} from './lesson';
import {Pack} from './pack';
import {Storage} from '../storage';


export class UserData {
    private lessons: Lesson[];

    public beganDate: Date;
    public lastStudiedDate: Date;

    public totalEntries: number;
    public totalPacks: number;
    public totalLessons: number;

    public currentLessonIndex: number;
    public currentReps: number;


    constructor() {
        this.beganDate = new Date();
        this.currentLessonIndex = 0;
        this.currentReps = 0;
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
    public async createAsync(entriesPerPack: number): Promise<void> {
        let subDirs: string[] = Storage.getDirectories();

        let entryMap: Map<string, Entry[]> = new Map<string, Entry[]>();
        let textMaps: Map<string, Map<string, string>> = await UserData.createTextMapsAsync(subDirs);

        let entryCount: number = 0;
        subDirs.forEach(function (subDir: string): void {
            let subDirEntries: Entry[] = [];
            let audioFiles: string[] = Storage.getFilesWithExt(subDir, 'mp3');
            let textMap: Map<string, string> = textMaps.get(subDir);

            audioFiles.forEach(function (fileName: string) {
                let text: string = null;
                if (textMap.has(fileName)) {
                    text = textMap.get(fileName);
                }

                let newEntry: Entry = new Entry(path.join(__dirname, '..', 'data', subDir, fileName), text);

                subDirEntries.push(newEntry);
            });

            entryCount += subDirEntries.length;
            entryMap.set(subDir, subDirEntries);
        });

        this.totalEntries = entryCount;
        let packs: Pack[] = this.createPacks(entryMap, entriesPerPack);
        this.lessons = this.createLessons(packs);
    }

    private static async createTextMapsAsync(subDirs: string[]): Promise<Map<string, Map<string, string>>> {
        let resultMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();

        const tasks: Promise<[string, Map<string, string>]>[] = [];
        subDirs.forEach(function(subDir: string) {
            tasks.push(Storage.parseCSVAsync(subDir));
        });

        let csvResults: [string, Map<string, string>][] = await Promise.all(tasks);
        csvResults.forEach(function(result: [string, Map<string, string>]) {
            resultMap.set(result[0], result[1]);
        });

        return resultMap;
    }

    /**
     * Assemble all entries into packs of entries of a defined length.
     * Pulls in entries round-robin across sub-directory sources in data folder.
     *
     * @param {Map<string, Entry[]>} entryMap: Map of source name to its Array of Entry objects.
     * @param {number} entriesPerPack: Number of entries per each pack.
     * @returns {Pack[]} Assembled packs.
     */
    private createPacks(entryMap: Map<string, Entry[]>, entriesPerPack: number): Pack[] {
        let sources: string[] = Array.from(entryMap.keys());

        let sourceIndexTracker: Map<string, number> = new Map<string, number>();
        for (let source of sources) {
            sourceIndexTracker.set(source, 0);
        }

        // Add entries to packs round robin across sources
        let packs: Pack[] = [];
        let usedSourceIdx: number = 0;
        let assembledPack: Entry[] = [];
        while (sources.length > 0) {
            // Which source to use, and which entry index we are currently on within that source
            if (usedSourceIdx >= sources.length) {
                usedSourceIdx = 0;
            }

            let usedSourceKey: string = sources[usedSourceIdx];
            let usedSourceEntryIdx: number = sourceIndexTracker.get(usedSourceKey);
            // If source has run out of available entries, remove it from sources for round robin
            if (usedSourceEntryIdx >= entryMap.get(usedSourceKey).length) {
                sources.splice(usedSourceIdx, 1);
                continue;
            }

            let currentEntry: Entry = entryMap.get(usedSourceKey)[usedSourceEntryIdx];
            assembledPack.push(currentEntry);

            // Add new pack once we have enough entries amassed, then clear it
            if (assembledPack.length >= entriesPerPack) {
                packs.push(new Pack(assembledPack));
                assembledPack = [];
            }

            // Increment source and source entry index trackers
            sourceIndexTracker.set(usedSourceKey, usedSourceEntryIdx + 1);
            usedSourceIdx++;
        }

        // Add any remaining entries as final pack
        if (assembledPack.length > 0) {
            packs.push(new Pack(assembledPack));
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
    private createLessons(packs: Pack[]): Lesson[] {
        let lessons: Lesson[] = [];
        let previousSeenPacks: Pack[] = [];
        packs.forEach(function(pack: Pack) {
            debugger;
            let combinedPacks: Pack[] = [pack].concat(previousSeenPacks);
            lessons.push(new Lesson(combinedPacks));

            previousSeenPacks.unshift(pack);
            if (previousSeenPacks.length > 4) {
                previousSeenPacks.pop();
            }
        });

        // Fade out the remaining entries, adding no new ones
        while (previousSeenPacks.length > 1) {
            previousSeenPacks.pop();
            let remainingPacks: Pack[] = [].concat(previousSeenPacks);
            lessons.push(new Lesson(remainingPacks));
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
    public getNextLesson(): Lesson {
        if (this.currentLessonIndex < this.lessons.length) {
            return this.lessons[this.currentLessonIndex];
        } else {
            return null;
        }
    }

    /**
     * Update data following the end of a user's training session.
     *
     * @param {number} repsPerEntry: Number of reps per entry the user has defined.
     */
    public update(repsPerEntry: number): void {
        let lastLesson: Lesson = this.lessons[this.currentLessonIndex];

        let seenReps: number = 0;
        lastLesson.packs.forEach(function(pack: Pack) {
            seenReps += pack.entries.length;
        });

        this.currentReps += (seenReps * repsPerEntry);
        this.currentLessonIndex++;
        this.lastStudiedDate = new Date();
    }
}
