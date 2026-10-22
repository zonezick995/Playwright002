"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TestOutputReporter {
    constructor() {
        this.outputByTest = new Map();
    }
    onStdOut(chunk, test) {
        this.capture("stdout", chunk, test);
    }
    onStdErr(chunk, test) {
        this.capture("stderr", chunk, test);
    }
    onTestEnd(test, result) {
        const output = this.outputByTest.get(test.id);
        if (!output) {
            return;
        }
        this.outputByTest.delete(test.id);
        if (result.status !== "passed") {
            return;
        }
        for (const chunk of output) {
            if (chunk.stream === "stdout") {
                process.stdout.write(chunk.content);
            }
            else {
                process.stderr.write(chunk.content);
            }
        }
    }
    capture(stream, chunk, test) {
        if (!test) {
            if (stream === "stdout") {
                process.stdout.write(chunk);
            }
            else {
                process.stderr.write(chunk);
            }
            return;
        }
        const output = this.outputByTest.get(test.id) ?? [];
        output.push({ stream, content: chunk });
        this.outputByTest.set(test.id, output);
    }
}
exports.default = TestOutputReporter;
