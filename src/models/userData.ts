import * as path from 'path';

import {Entry} from './entry';
import {Pack} from './pack';
import {Storage} from '../storage';


export class UserData {
    private readonly repsPerEntry: number = 4;
    private readonly packs: Pack[];

    public beganDate: Date;
    public entriesPerPack: number;
    public totalPacks: number;

    public lastStudiedDate: Date;
    public currentPackIndex: number;
    public currentReps: number;


    constructor(entriesPerPack: number) {
        this.beganDate = new Date();
        this.entriesPerPack = entriesPerPack;
        this.totalPacks = 0;
        this.packs = []
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
    public async createAsync(): Promise<void> {
        let subDirs: string[] = Storage.getDirectories();

        let entryMap: Map<string, Entry[]> = new Map<string, Entry[]>();
        let textMaps: Map<string, Map<string, string>> = await UserData.createTextMapsAsync(subDirs);

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

            entryMap.set(subDir, subDirEntries);
        });

        this.createPacks(entryMap);
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
    private createPacks(entryMap: Map<string, Entry[]>): void {
        let sources: string[] = Array.from(entryMap.keys());

        let sourceIndexTracker: Map<string, number> = new Map<string, number>();
        for (let source of sources) {
            sourceIndexTracker.set(source, 0);
        }

        // Add entries to packs round robin across sources
        let usedSourceIdx: number = 0;
        let previousEntries: Entry[] = [];
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

            // Pack is entries n-4, n-3, n-2, n-1, n
            let currentEntry: Entry = entryMap.get(usedSourceKey)[usedSourceEntryIdx];
            let entriesForPack: Entry[] = [currentEntry].concat(previousEntries);

            this.packs.push(new Pack(entriesForPack));

            // Update last ("entriesPerPack" - 1) entries, removing last (oldest) entry if over ("entriesPerPack" - 1)
            previousEntries.unshift(currentEntry);
            if (previousEntries.length > this.entriesPerPack - 1) {
                previousEntries.pop();
            }

            // Increment source and source entry index trackers
            sourceIndexTracker.set(usedSourceKey, usedSourceEntryIdx + 1);
            usedSourceIdx++;
        }

        // Fade out the remaining entries, adding no new ones
        while (previousEntries.length > 1) {
            previousEntries.pop();
            let remainingEntries: Entry[] = [].concat(previousEntries);
            this.packs.push(new Pack(remainingEntries));
        }

        this.totalPacks = this.packs.length;
    }

    /**
     * Find and return the next Pack to be presented to the user.
     * If none exists, return null.
     *
     * @returns {Pack} Pack object.
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
}
