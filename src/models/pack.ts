import { Entry} from "./entry";


export class Pack {
    public entries: Entry[];


    constructor(entries: Entry[]) {
        this.entries = entries;
    }
}
