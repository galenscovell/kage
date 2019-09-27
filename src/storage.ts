import {app, remote} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import 'reflect-metadata';
import {plainToClass} from 'class-transformer';
import {classToPlain} from 'class-transformer';

import {UserData} from './models/userData';


export class Storage {
    private readonly path: string;


    constructor(configName: string) {
        let userDataPath: string = (app || remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${configName}.json`);
    }

    /**
     * Create and save a new instance of userData.
     *
     * @param {number} entriesPerPack: Number of entries per training pack.
     * @returns {UserData}
     */
    public async createAsync(entriesPerPack: number): Promise<UserData> {
        let newUserData: UserData = new UserData(entriesPerPack);
        await newUserData.createEntriesAsync();
        this.save(newUserData);

        return newUserData;
    }

    /**
     * Attempt to load in a saved version of userData. If not exists, return null;
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
}
