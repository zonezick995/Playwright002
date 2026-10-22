import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

type OutputChunk = {
  stream: "stdout" | "stderr";
  content: string | Buffer;
};

export default class TestOutputReporter implements Reporter {
  private readonly outputByTest = new Map<string, OutputChunk[]>();

  onStdOut(chunk: string | Buffer, test?: TestCase): void {
    this.capture("stdout", chunk, test);
  }

  onStdErr(chunk: string | Buffer, test?: TestCase): void {
    this.capture("stderr", chunk, test);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
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
      } else {
        process.stderr.write(chunk.content);
      }
    }
  }

  private capture(stream: OutputChunk["stream"], chunk: string | Buffer, test?: TestCase): void {
    if (!test) {
      if (stream === "stdout") {
        process.stdout.write(chunk);
      } else {
        process.stderr.write(chunk);
      }
      return;
    }

    const output = this.outputByTest.get(test.id) ?? [];
    output.push({ stream, content: chunk });
    this.outputByTest.set(test.id, output);
  }
}
