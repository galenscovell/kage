
export class Entry {
    public audioFilePath: string;
    public text: string;


    constructor(audioFilePath: string, text: string = null) {
        this.audioFilePath = audioFilePath;
        this.text = text;
    }
}
