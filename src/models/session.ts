import {Howl} from 'howler';

import {Lesson} from './lesson';
import {Pack} from './pack';
import {Entry} from './entry';


export class Session {
    public reps: Entry[];
    public currentEntryIdx: number;
    public currentEntry: Entry;
    public currentSound: Howl;


    constructor(lesson: Lesson, repsPerEntry: number) {
        let sessionReps: Entry[] = [];
        lesson.packs.forEach((pack: Pack) => {
            let entriesInPack: Entry[] = pack.entries;

            for (let repetitions = 0; repetitions < repsPerEntry; repetitions++) {
                sessionReps = sessionReps.concat(Session.shuffleEntries(entriesInPack));
            }
        });

        this.reps = sessionReps;
        this.currentEntryIdx = 0;
        this.currentEntry = this.reps[this.currentEntryIdx];
    }

    public loadNext(): void {
        this.currentEntry = this.reps[this.currentEntryIdx];

        this.currentSound = new Howl({
            src: [this.currentEntry.audioFilePath],
            preload: true,
            autoplay: false
        });
    }

    public playNext(textElement: JQuery<HTMLElement>, remainingElement: JQuery<HTMLElement>): number {
        this.setText(textElement);
        this.setRemaining(remainingElement);

        this.currentSound.play();
        this.currentEntryIdx++;

        return this.currentSound.duration() * 1000;
    }

    public hasRemaining(): boolean {
        return this.currentEntryIdx < this.reps.length;
    }

    public setText(textElement: JQuery<HTMLElement>): void {
        textElement.text(this.currentEntry.text);
    }

    public setRemaining(remainingElement: JQuery<HTMLElement>): void {
        let remaining: number = this.reps.length - (this.currentEntryIdx + 1);
        remainingElement.text(`${remaining} left`);
    }

    private static shuffleEntries(entries: Entry[]): Entry[] {
        for (let i = entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entries[i], entries[j]] = [entries[j], entries[i]];
        }

        return entries;
    }
}
