
export class Entry {
    public audioFilePath: string;
    public text: string;


    constructor(audioFilePath: string, text: string) {
        this.audioFilePath = audioFilePath;
        this.text = text;
    }
}
