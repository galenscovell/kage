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
     * @param {number} entriesPerPack
     */
    createAsync(entriesPerPack) {
        return __awaiter(this, void 0, void 0, function* () {
            let newUserData = new userData_1.UserData(entriesPerPack);
            yield newUserData.createEntriesAsync();
            this.save(newUserData);
            return newUserData;
        });
    }
    /**
     * Attempt to load in a saved version of userData.
     * If not exists, return null;
     * @returns {UserData}
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
     * @param {UserData} userData
     */
    save(userData) {
        let serialized = JSON.stringify(class_transformer_2.classToPlain(userData));
        fs.writeFileSync(this.path, serialized);
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map