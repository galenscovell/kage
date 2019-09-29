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
const csv = require("neat-csv");
const userData_1 = require("./models/userData");
class Storage {
    constructor(configName) {
        let userDataPath = (electron_1.app || electron_1.remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${configName}.json`);
    }
    /**
     * Create and save a new instance of userData. First deletes the current UserData.
     *
     * @param {number} entriesPerPack: Number of entries per training pack.
     * @returns {UserData} The newly created UserData object.
     */
    createAsync(entriesPerPack) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs.existsSync(this.path)) {
                fs.unlinkSync(this.path);
            }
            let newUserData = new userData_1.UserData();
            yield newUserData.createAsync(entriesPerPack);
            this.save(newUserData);
            return newUserData;
        });
    }
    /**
     * Attempt to load in a saved version of userData. If not exists, return null;
     *
     * @returns {UserData} The loaded data, or null.
     */
    load() {
        try {
            let serialized = JSON.parse(fs.readFileSync(this.path, 'utf8'));
            return class_transformer_1.plainToClass(userData_1.UserData, serialized);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Save userData, updating all entries.
     *
     * @param {UserData} userData: The data to be saved to disk.
     */
    save(userData) {
        let serialized = JSON.stringify(class_transformer_2.classToPlain(userData));
        fs.writeFileSync(this.path, serialized);
    }
    /**
     * Get list of sub-directory names within data folder.
     *
     * @returns {string[]} Array of directory names.
     */
    static getDirectories() {
        let dirPath = path.join(__dirname, 'data');
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
    static getFilesWithExt(subDir, ext) {
        let dirPath = path.join(__dirname, 'data', subDir);
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
    static parseCSVAsync(subDir) {
        return __awaiter(this, void 0, void 0, function* () {
            let textMap = new Map();
            let csvFiles = Storage.getFilesWithExt(subDir, 'csv');
            if (csvFiles !== null && csvFiles.length > 0) {
                let csvPath = path.join(__dirname, 'data', subDir, csvFiles[0]);
                let csvInput = yield fs.readFileSync(csvPath, 'utf8');
                let csvData = yield csv(csvInput, {
                    headers: ['index', 'sentence'], separator: ',', skipLines: 1
                });
                csvData.forEach((row) => {
                    textMap.set(`${row['index']}.mp3`, row['sentence']);
                });
            }
            return [subDir, textMap];
        });
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map