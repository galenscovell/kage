"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const howler_1 = require("howler");
class Session {
    constructor(lesson, repsPerEntry) {
        let sessionReps = [];
        lesson.packs.forEach((pack) => {
            let entriesInPack = pack.entries;
            for (let repetitions = 0; repetitions < repsPerEntry; repetitions++) {
                // Randomize all entries after first
                // This is to prevent there every being duplicate entries side by side
                sessionReps.push(entriesInPack[0]);
                sessionReps = sessionReps.concat(Session.shuffleEntries(entriesInPack.slice(1)));
            }
        });
        this.reps = sessionReps;
        this.currentEntryIdx = 0;
        this.currentEntry = this.reps[this.currentEntryIdx];
    }
    loadNext() {
        this.currentEntry = this.reps[this.currentEntryIdx];
        this.currentSound = new howler_1.Howl({
            src: [this.currentEntry.audioFilePath],
            preload: true,
            autoplay: false
        });
    }
    playNext(textElement, remainingElement) {
        this.setText(textElement);
        this.setRemaining(remainingElement);
        this.currentSound.play();
        this.currentEntryIdx++;
        return this.currentSound.duration() * 1000;
    }
    hasRemaining() {
        return this.currentEntryIdx < this.reps.length;
    }
    setText(textElement) {
        textElement.text(this.currentEntry.text);
    }
    setRemaining(remainingElement) {
        let remaining = this.reps.length - (this.currentEntryIdx + 1);
        remainingElement.text(`${remaining} left`);
    }
    static shuffleEntries(entries) {
        for (let i = entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entries[i], entries[j]] = [entries[j], entries[i]];
        }
        return entries;
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map