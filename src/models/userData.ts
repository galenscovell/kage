import {readdirSync, readFileSync} from 'fs';
import * as path from 'path';

import {Row} from 'neat-csv';
import csv = require('neat-csv');

import {Entry} from './entry';
import {Pack} from './pack';


export class UserData {
    private readonly repsPerEntry: number = 4;

    private entries: Map<string, Entry[]>;
    private packs: Pack[];

    public beganDate: Date;
    public entriesPerPack: number;

    public lastStudiedDate: Date;
    public currentPackIndex: number;
    public currentReps: number;


    constructor(entriesPerPack: number) {
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
    public async createEntriesAsync(): Promise<void> {
        let subDirs: string[] = UserData.getDirectories();

        let entryMap: Map<string, Entry[]> = new Map<string, Entry[]>();
        let textMaps: Map<string, Map<string, string>> = await UserData.createTextMapsAsync(subDirs);

        subDirs.forEach(function (subDir: string): void {
            let subDirEntries: Entry[] = [];
            let audioFiles: string[] = UserData.getFilesWithExt(subDir, 'mp3');
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

        this.entries = entryMap;
    }

    private static async createTextMapsAsync(subDirs: string[]): Promise<Map<string, Map<string, string>>> {
        let resultMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();

        const tasks: Promise<[string, Map<string, string>]>[] = [];
        subDirs.forEach(function(subDir: string) {
            tasks.push(UserData.parseCSVAsync(subDir));
        });

        let csvResults: [string, Map<string, string>][] = await Promise.all(tasks);
        csvResults.forEach(function(result: [string, Map<string, string>]) {
            resultMap.set(result[0], result[1]);
        });

        return resultMap;
    }

    private static async parseCSVAsync(subDir: string): Promise<[string, Map<string, string>]> {
        let textMap: Map<string, string> = new Map<string, string>();

        let csvFiles: string[] = UserData.getFilesWithExt(subDir, 'csv');
        if (csvFiles !== null && csvFiles.length > 0) {
            let csvPath: string = path.join(__dirname, '..', 'data', subDir, csvFiles[0]);
            let csvInput: string = await readFileSync(csvPath, 'utf8');
            let csvData: Row[] = await csv(csvInput,{
                headers: ['index', 'sentence'], separator: ',', skipLines: 1});

            csvData.forEach(function(row: Row) {
                textMap.set(`${row['index']}.mp3`, row['sentence']);
            });
        }

        return [subDir, textMap];
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
    private createPacks(): Pack[] {
        let sources: IterableIterator<string> = this.entries.keys();


        return null;
    }

    /**
     * Find and return the next Pack to be presented to the user.
     * If none exists, return null.
     * @returns {Pack} pack object
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

    /**
     * Get list of sub-directory names within data folder.
     * @returns {string[]} array of directory names
     */
    private static getDirectories(): string[] {
        let dirPath: string = path.join(__dirname, '..', 'data');
        let dirs = readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());
        return dirs.map(dirent => dirent.name);
    }

    /**
     * Get list of filenames with specific extension within specific sub-directory.
     * @param subDir
     * @param extension
     * @returns {string[]} array of filenames
     */
    private static getFilesWithExt(subDir: string, extension: string): string[] {
        let dirPath: string = path.join(__dirname, '..', 'data', subDir);
        let files = readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);
        return files.filter(name => name.endsWith(extension));
    }
}
