"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const fs = require("fs");
require("reflect-metadata");
const class_transformer_1 = require("class-transformer");
const class_transformer_2 = require("class-transformer");
const userData_1 = require("./models/userData");
class Storage {
    constructor(configName) {
        let userDataPath = (electron_1.app || electron_1.remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${configName}.json`);
    }
    /**
     * Create and save a new instance of userData.
     * @param entriesPerPack {number}
     */
    create(entriesPerPack) {
        let newUserData = new userData_1.UserData(entriesPerPack);
        this.save(newUserData);
        return newUserData;
    }
    /**
     * Attempt to load in a saved version of userData.
     * If not exists, return null;
     */
    load() {
        try {
            let serialized = JSON.parse(fs.readFileSync(this.path).toString());
            return class_transformer_1.plainToClass(userData_1.UserData, serialized);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Save userData, updating all entries.
     * @param userData {UserData}
     */
    save(userData) {
        let serialized = JSON.stringify(class_transformer_2.classToPlain(userData));
        fs.writeFileSync(this.path, serialized);
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map