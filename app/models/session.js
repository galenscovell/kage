"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const howler_1 = require("howler");
class Session {
    constructor(lesson, repsPerEntry) {
        let sessionReps = [];
        lesson.packs.forEach((pack) => {
            let entriesInPack = pack.entries;
            for (let repetitions = 0; repetitions < repsPerEntry; repetitions++) {
                sessionReps = sessionReps.concat(Session.shuffleEntries(entriesInPack));
            }
        });
        this.reps = sessionReps;
        this.currentEntryIdx = 0;
        this.currentEntry = this.reps[this.currentEntryIdx];
    }
    playNextRep(textElement, remainingElement) {
        this.currentEntry = this.reps[this.currentEntryIdx];
        this.setText(textElement);
        this.setRemaining(remainingElement);
        this.currentSound = new howler_1.Howl({
            src: [this.currentEntry.audioFilePath]
        });
        this.currentSound.once('load', () => {
            this.currentSound.play();
        });
        this.currentSound.on('end', () => {
            this.currentSound.stop();
            this.currentSound.unload();
            this.currentEntryIdx++;
        });
    }
    static hasRemaining(session) {
        return session.currentEntryIdx < session.reps.length;
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