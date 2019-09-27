import {app, remote} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import 'reflect-metadata';
import {plainToClass} from 'class-transformer';
import {classToPlain} from 'class-transformer';

import {UserData} from "./models/userData";


export class Storage {
    private readonly path: string;


    constructor(configName: string) {
        let userDataPath: string = (app || remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${configName}.json`);
    }

    /**
     * Create and save a new instance of userData.
     * @param {number} entriesPerPack
     */
    public async createAsync(entriesPerPack: number): Promise<UserData> {
        let newUserData: UserData = new UserData(entriesPerPack);
        await newUserData.createEntriesAsync();
        this.save(newUserData);
        return newUserData;
    }

    /**
     * Attempt to load in a saved version of userData.
     * If not exists, return null;
     * @returns {UserData}
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
     * @param {UserData} userData
     */
    public save(userData: UserData) {
        let serialized: string = JSON.stringify(classToPlain(userData));
        fs.writeFileSync(this.path, serialized);
    }
}
