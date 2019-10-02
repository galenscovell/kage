import {app, remote} from 'electron';
import * as fs from 'fs';
import * as path from 'path';

import 'reflect-metadata';
import {Row} from 'neat-csv';
import {classToPlain, plainToClass} from 'class-transformer';

import {UserData} from './models/userData';
import csv = require('neat-csv');


export class Storage {
    private readonly path: string;


    constructor(configName: string) {
        let userDataPath: string = (app || remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${configName}.json`);
    }

    /**
     * Create and save a new instance of userData. First deletes the current UserData.
     *
     * @param {number} entriesPerPack: Number of entries per training pack.
     * @returns {UserData} The newly created UserData object.
     */
    public async createAsync(entriesPerPack: number): Promise<UserData> {
        if (fs.existsSync(this.path)) {
            fs.unlinkSync(this.path);
        }

        let newUserData: UserData = new UserData();
        await newUserData.createAsync(entriesPerPack);
        this.save(newUserData);

        return newUserData;
    }

    /**
     * Attempt to load in a saved version of userData. If not exists, return null.
     *
     * @returns {UserData} The loaded data, or null.
     */
    public load(): UserData {
        try {
            let serialized: object = JSON.parse(fs.readFileSync(this.path, 'utf8'));
            return plainToClass(UserData, serialized);
        } catch (error) {
            return null;
        }
    }

    /**
     * Save userData, updating all entries.
     *
     * @param {UserData} userData: The data to be saved to disk.
     */
    public save(userData: UserData): void {
        let serialized: string = JSON.stringify(classToPlain(userData));
        fs.writeFileSync(this.path, serialized);
    }

    /**
     * Get list of sub-directory names within data folder.
     *
     * @returns {string[]} Array of directory names.
     */
    public static getDirectories(): string[] {
        let dirPath: string = path.join(__dirname, 'data');
        let dirs = fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());

        return dirs.map(dirent => dirent.name);
    }

    /**
     * Get list of filenames with specific extension within specific sub-directory.
     *
     * @param {string} subDir: The sub-directory name for this source.
     * @param {string} ext: The file extension, not including period.
     * @returns {string[]} Array of filenames.
     */
    public static getFilesWithExt(subDir: string, ext: string): string[] {
        let dirPath: string = path.join(__dirname, 'data', subDir);
        let files = fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);

        return files.filter(name => name.endsWith(ext));
    }

    /**
     * Parse an individual source's CSV, mapping text to audio filename.
     *
     * @param {string} subDir: The sub-directory name for this source.
     * @returns {[string, Map<string, string>]} Tuple of [subDir name, { audioFileName: text}].
     */
    public static async parseCSVAsync(subDir: string): Promise<[string, Map<string, string>]> {
        let textMap: Map<string, string> = new Map<string, string>();

        let csvFiles: string[] = Storage.getFilesWithExt(subDir, 'csv');
        if (csvFiles !== null && csvFiles.length > 0) {
            let csvPath: string = path.join(__dirname, 'data', subDir, csvFiles[0]);
            let csvInput: string = await fs.readFileSync(csvPath, 'utf8');
            let csvData: Row[] = await csv(csvInput,{
                headers: ['index', 'sentence'], separator: ',', skipLines: 1});

            csvData.forEach((row: Row) => {
                textMap.set(`${row['index']}.mp3`, row['sentence']);
            });
        }

        return [subDir, textMap];
    }
}
