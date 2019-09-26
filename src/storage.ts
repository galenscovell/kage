import { app, remote } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import "reflect-metadata";
import { plainToClass } from "class-transformer";
import { classToPlain } from "class-transformer";
import { UserData } from "./models/userData";


export class Storage {
    private readonly path: string;


    constructor(configName: string) {
        let userDataPath: string = (app || remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${configName}.json`);
    }

    /**
     * Create and save a new instance of userData.
     * @param entriesPerPack {number}
     */
    public create(entriesPerPack: number): UserData {
        let newUserData: UserData = new UserData(entriesPerPack);
        this.save(newUserData);
        return newUserData;
    }

    /**
     * Attempt to load in a saved version of userData.
     * If not exists, return null;
     */
    public load(): UserData {
        try {
            let serialized: object = JSON.parse(fs.readFileSync(this.path).toString());
            return plainToClass(UserData, serialized);
        } catch (error) {
            return null;
        }
    }

    /**
     * Save userData, updating all entries.
     * @param userData {UserData}
     */
    public save(userData: UserData) {
        let serialized: string = JSON.stringify(classToPlain(userData));
        fs.writeFileSync(this.path, serialized);
    }
}
