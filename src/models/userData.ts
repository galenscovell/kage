import * as path from 'path';

import {Entry} from './entry';
import {Lesson} from './lesson';
import {Pack} from './pack';
import {Storage} from '../storage';
import {Session} from './session';


export class UserData {
    private lessons: Lesson[];

    private readonly beganDate: Date;
    private lastStudiedDate: Date;

    public sources: string[];

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

    public getFormattedDateString(): string {
        let beganDate: Date = new Date(this.beganDate);
        let beganMonth: number = beganDate.getMonth();
        let beganDay: number = beganDate.getDate();
        let beganYear: number = beganDate.getFullYear();
        let began: string = `${beganMonth}-${beganDay}-${beganYear}`;

        let last: string = `No days studied`;
        if (!this.dayHasPassedSinceLastStudied()) {
            last = 'Today';
        } else if (this.lastStudiedDate !== null && this.lastStudiedDate !== undefined) {
            let lastDate: Date = new Date(this.lastStudiedDate);
            let lastMonth: number = lastDate.getMonth();
            let lastDay: number = lastDate.getDate();
            let lastYear: number = lastDate.getFullYear();
            last = `${lastMonth}-${lastDay}-${lastYear}`;
        }

        return `Created: ${began} | Last Studied: ${last}`
    }

    public getFormattedSourcesString(): string {
        return `Sources: ${this.sources.join(', ')}`;
    }

    public getFormattedCompletionString(): string {
        return `${this.getFormattedCompletionPctString()} complete`;
    }

    public getFormattedCompletionPctString(): string {
        return `${(this.currentLessonIndex / this.totalLessons).toFixed(4)}%`;
    }

    public dayHasPassedSinceLastStudied(): boolean {
        if (this.lastStudiedDate === null || this.lastStudiedDate === undefined) {
            return true;
        }

        let lastDate: Date = new Date(this.lastStudiedDate);
        let currentDate: Date = new Date();

        let dayDifference: number = currentDate.getDate() - lastDate.getDate();

        return dayDifference >= 1;
    }

    /**
     * Iterate across all files in data directory, creating individual entries, packs and lessons.
     *
     * @param {number} entriesPerPack: Number of entries per each pack.
     */
    public async createAsync(entriesPerPack: number): Promise<void> {
        this.sources = Storage.getDirectories();

        let entryMap: Map<string, Entry[]> = new Map<string, Entry[]>();
        let textMaps: Map<string, Map<string, string>> = await this.createTextMapsAsync();

        let entryCount: number = 0;
        this.sources.forEach((subDir: string) => {
            let subDirEntries: Entry[] = [];
            let audioFiles: string[] = Storage.getFilesWithExt(subDir, 'mp3');
            let textMap: Map<string, string> = textMaps.get(subDir);

            audioFiles.forEach((fileName: string) => {
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

    private async createTextMapsAsync(): Promise<Map<string, Map<string, string>>> {
        let resultMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();

        const tasks: Promise<[string, Map<string, string>]>[] = [];
        this.sources.forEach((subDir: string) => {
            tasks.push(Storage.parseCSVAsync(subDir));
        });

        let csvResults: [string, Map<string, string>][] = await Promise.all(tasks);
        csvResults.forEach((result: [string, Map<string, string>]) => {
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
        let sources: string[] = Array.from(this.sources.values());

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
        packs.forEach((pack: Pack) => {
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
     * Generate and return the next Session to be presented to the user.
     * If none exists, return null.
     *
     * @param {number} repsPerEntry: Number of repetitions for each entry as defined by user.
     * @returns {Session} Session object.
     */
    public prepareSession(repsPerEntry: number): Session {
        if (this.currentLessonIndex < this.lessons.length) {
            return new Session(this.lessons[this.currentLessonIndex], repsPerEntry);
        } else {
            return null;
        }
    }

    /**
     * Update data following the end of a user's training session.
     *
     * @param {Session} session: Session that was just completed.
     */
    public finishSession(session: Session): void {
        this.currentReps += session.reps.length;
        this.currentLessonIndex++;
        this.lastStudiedDate = new Date();
    }
}
