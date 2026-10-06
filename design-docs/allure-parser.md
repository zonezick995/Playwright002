Đúng. Với mục tiêu sau này **Allure → DB → visualize**, mình không khuyên nhét tất cả vào `allure-parser.ts`. Nên tách thành các module nhỏ, mỗi file chịu trách nhiệm một việc.

 Mình đề xuất cấu trúc:

```
src/
└── allure/
    ├── types/
    │   ├── allure.types.ts
    │   └── parsed.types.ts
    │
    ├── parsers/
    │   ├── allure-result.parser.ts
    │   ├── allure-step.parser.ts
    │   └── allure-attachment.parser.ts
    │
    ├── allure-results.parser.ts
    │
    └── index.ts
```

 Flow:

```
allure-results/
│
├── abc-result.json ──────┐
├── def-result.json ──────┤
├── xyz-result.json ──────┤
├── abc-attachment.png    │
└── def-attachment.txt    │
                          │
                          ▼
                AllureResultsParser
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        ResultParser  StepParser  AttachmentParser
             │            │            │
             └────────────┼────────────┘
                          ▼
                ParsedAllureResult[]
                          │
                          ▼
                         DB
```

 ## 1\. `types/allure.types.ts`

 Đây chỉ chứa **raw schema** của `allure-playwright`.

```
// src/allure/types/allure.types.ts

export interface AllureLabel {
  name: string;
  value: string;
}

export interface AllureParameter {
  name: string;
  value?: string | null;
}

export interface AllureStatusDetails {
  message?: string | null;
  trace?: string | null;
}

export interface AllureAttachment {
  name: string;
  source: string;
  type?: string | null;
}

export interface AllureStep {
  name: string;

  status?: string | null;
  stage?: string | null;

  start?: number | null;
  stop?: number | null;

  statusDetails?: AllureStatusDetails | null;

  parameters?: AllureParameter[] | null;

  attachments?: AllureAttachment[] | null;

  steps?: AllureStep[] | null;
}

export interface AllureResult {
  uuid: string;

  historyId?: string | null;
  testCaseId?: string | null;

  name: string;
  fullName?: string | null;

  status?: string | null;
  stage?: string | null;

  start?: number | null;
  stop?: number | null;

  statusDetails?: AllureStatusDetails | null;

  labels?: AllureLabel[] | null;

  parameters?: AllureParameter[] | null;

  steps?: AllureStep[] | null;

  attachments?: AllureAttachment[] | null;

  links?: unknown[] | null;
}
```

---

 # 2\. `types/parsed.types.ts`

 Đây là **model sau khi parse**.

```
// src/allure/types/parsed.types.ts

import type {
  AllureAttachment,
  AllureResult,
  AllureStep,
} from "./allure.types";

export interface ParsedAllureAttachment
  extends AllureAttachment {
  /**
   * Absolute path tới attachment.
   */
  path: string;

  /**
   * File có tồn tại trên filesystem hay không.
   */
  exists: boolean;
}

export interface ParsedAllureStep
  extends Omit<
    AllureStep,
    "steps" | "attachments"
  > {
  /**
   * Duration của step, milliseconds.
   */
  duration?: number;

  /**
   * Nested steps.
   */
  steps: ParsedAllureStep[];

  /**
   * Attachments của step.
   */
  attachments: ParsedAllureAttachment[];
}

export interface ParsedAllureResult
  extends Omit<
    AllureResult,
    "steps" | "attachments"
  > {
  /**
   * Duration của test.
   */
  duration?: number;

  /**
   * Tên file JSON.
   *
   * Ví dụ:
   *
   *     abc-result.json
   */
  resultFile: string;

  /**
   * Absolute path tới JSON.
   */
  resultFilePath: string;

  /**
   * Parsed steps.
   */
  steps: ParsedAllureStep[];

  /**
   * Parsed attachments.
   */
  attachments: ParsedAllureAttachment[];
}
```

---

 # 3\. `parsers/allure-attachment.parser.ts`

 Chịu trách nhiệm **chỉ về attachment**.

```
// src/allure/parsers/allure-attachment.parser.ts

import { stat } from "node:fs/promises";
import path from "node:path";

import type {
  AllureAttachment,
} from "../types/allure.types";

import type {
  ParsedAllureAttachment,
} from "../types/parsed.types";

export interface AllureAttachmentParserOptions {
  /**
   * Nếu true:
   *
   * attachment được reference nhưng không tồn tại
   * => throw error.
   *
   * Default: false
   */
  strict?: boolean;
}

export class AllureAttachmentParser {
  constructor(
    private readonly resultsDir: string,
    private readonly options: AllureAttachmentParserOptions = {},
  ) {}

  /**
   * Parse một attachment.
   */
  async parse(
    attachment: AllureAttachment,
  ): Promise<ParsedAllureAttachment> {
    /**
     * source là filename nằm trong allure-results.
     *
     * Ví dụ:
     *
     *     abc-attachment.png
     */
    const attachmentPath = path.resolve(
      this.resultsDir,
      attachment.source,
    );

    /**
     * Kiểm tra file tồn tại.
     */
    const exists =
      await this.fileExists(
        attachmentPath,
      );

    /**
     * Strict mode:
     *
     * Không tìm thấy attachment => fail.
     */
    if (
      this.options.strict &&
      !exists
    ) {
      throw new Error(
        `Allure attachment not found: ${attachmentPath}`,
      );
    }

    return {
      ...attachment,

      path: attachmentPath,

      exists,
    };
  }

  /**
   * Parse nhiều attachment.
   */
  async parseMany(
    attachments: AllureAttachment[],
  ): Promise<ParsedAllureAttachment[]> {
    return Promise.all(
      attachments.map(
        attachment =>
          this.parse(attachment),
      ),
    );
  }

  /**
   * Kiểm tra file tồn tại.
   */
  private async fileExists(
    filePath: string,
  ): Promise<boolean> {
    try {
      await stat(filePath);

      return true;
    } catch {
      return false;
    }
  }
}
```

---

 # 4\. `parsers/allure-step.parser.ts`

 Chịu trách nhiệm **recursive steps**.

```
// src/allure/parsers/allure-step.parser.ts

import type {
  AllureStep,
} from "../types/allure.types";

import type {
  ParsedAllureStep,
} from "../types/parsed.types";

import {
  AllureAttachmentParser,
} from "./allure-attachment.parser";

export class AllureStepParser {
  constructor(
    private readonly attachmentParser:
      AllureAttachmentParser,
  ) {}

  /**
   * Parse nhiều steps.
   */
  async parseMany(
    steps: AllureStep[],
  ): Promise<ParsedAllureStep[]> {
    return Promise.all(
      steps.map(step =>
        this.parse(step),
      ),
    );
  }

  /**
   * Parse một step.
   */
  async parse(
    step: AllureStep,
  ): Promise<ParsedAllureStep> {
    /**
     * Parse nested steps.
     */
    const childSteps =
      await this.parseMany(
        step.steps ?? [],
      );

    /**
     * Parse attachments của step.
     */
    const attachments =
      await this.attachmentParser.parseMany(
        step.attachments ?? [],
      );

    /**
     * Tính duration.
     */
    const duration =
      this.calculateDuration(
        step.start,
        step.stop,
      );

    return {
      ...step,

      steps: childSteps,

      attachments,

      duration,
    };
  }

  /**
   * Tính duration của step.
   */
  private calculateDuration(
    start?: number | null,
    stop?: number | null,
  ): number | undefined {
    if (
      start == null ||
      stop == null
    ) {
      return undefined;
    }

    if (stop < start) {
      return undefined;
    }

    return stop - start;
  }
}
```

---

 # 5\. `parsers/allure-result.parser.ts`

 Đây là class chịu trách nhiệm **một `*-result.json`**.

 Đây là điểm quan trọng: mỗi file result được quản lý độc lập.

```
// src/allure/parsers/allure-result.parser.ts

import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

import type {
  AllureResult,
} from "../types/allure.types";

import type {
  ParsedAllureResult,
} from "../types/parsed.types";

import {
  AllureStepParser,
} from "./allure-step.parser";

import {
  AllureAttachmentParser,
} from "./allure-attachment.parser";

export class AllureResultParser {
  constructor(
    private readonly resultsDir: string,

    private readonly stepParser:
      AllureStepParser,

    private readonly attachmentParser:
      AllureAttachmentParser,
  ) {}

  /**
   * Parse một file:
   *
   *     abc-result.json
   */
  async parse(
    fileName: string,
  ): Promise<ParsedAllureResult> {
    const filePath = path.join(
      this.resultsDir,
      fileName,
    );

    /**
     * Đọc JSON.
     */
    const result =
      await this.readJson(filePath);

    /**
     * Validate.
     */
    this.validate(
      result,
      fileName,
    );

    /**
     * Parse steps.
     */
    const steps =
      await this.stepParser.parseMany(
        result.steps ?? [],
      );

    /**
     * Parse test-level attachments.
     */
    const attachments =
      await this.attachmentParser.parseMany(
        result.attachments ?? [],
      );

    /**
     * Calculate duration.
     */
    const duration =
      this.calculateDuration(
        result.start,
        result.stop,
      );

    return {
      ...result,

      resultFile: fileName,

      resultFilePath: filePath,

      duration,

      steps,

      attachments,
    };
  }

  /**
   * Đọc JSON.
   */
  private async readJson(
    filePath: string,
  ): Promise<AllureResult> {
    let content: string;

    try {
      content =
        await readFile(
          filePath,
          "utf8",
        );
    } catch (error) {
      throw new Error(
        `Cannot read Allure result "${filePath}": ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }

    try {
      return JSON.parse(
        content,
      ) as AllureResult;
    } catch (error) {
      throw new Error(
        `Invalid JSON "${filePath}": ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  /**
   * Validate result.
   */
  private validate(
    result: AllureResult,
    fileName: string,
  ): void {
    if (!result.uuid) {
      throw new Error(
        `Allure result "${fileName}" has no uuid`,
      );
    }

    if (!result.name) {
      throw new Error(
        `Allure result "${fileName}" has no name`,
      );
    }

    if (
      result.start != null &&
      result.stop != null &&
      result.stop < result.start
    ) {
      throw new Error(
        `Allure result "${fileName}" has stop < start`,
      );
    }
  }

  /**
   * Calculate duration.
   */
  private calculateDuration(
    start?: number | null,
    stop?: number | null,
  ): number | undefined {
    if (
      start == null ||
      stop == null
    ) {
      return undefined;
    }

    if (stop < start) {
      return undefined;
    }

    return stop - start;
  }
}
```

---

 # 6\. `allure-results.parser.ts`

 Đây mới là **orchestrator**.

 Nó chỉ có nhiệm vụ:

1. Scan directory.
2. Tìm `*-result.json`.
3. Giao từng file cho `AllureResultParser`.
4. Sort kết quả.

```
// src/allure/allure-results.parser.ts

import {
  readdir,
  stat,
} from "node:fs/promises";

import path from "node:path";

import type {
  ParsedAllureResult,
} from "./types/parsed.types";

import {
  AllureAttachmentParser,
} from "./parsers/allure-attachment.parser";

import {
  AllureStepParser,
} from "./parsers/allure-step.parser";

import {
  AllureResultParser,
} from "./parsers/allure-result.parser";

export interface AllureResultsParserOptions {
  /**
   * Nếu true, attachment bị thiếu sẽ làm parser throw error.
   */
  strictAttachments?: boolean;
}

export class AllureResultsParser {
  private readonly resultsDir: string;

  private readonly resultParser:
    AllureResultParser;

  constructor(
    resultsDir = "allure-results",
    options: AllureResultsParserOptions = {},
  ) {
    /**
     * Normalize path.
     */
    this.resultsDir =
      path.resolve(resultsDir);

    /**
     * Attachment parser.
     */
    const attachmentParser =
      new AllureAttachmentParser(
        this.resultsDir,
        {
          strict:
            options.strictAttachments ??
            false,
        },
      );

    /**
     * Step parser.
     */
    const stepParser =
      new AllureStepParser(
        attachmentParser,
      );

    /**
     * Result parser.
     */
    this.resultParser =
      new AllureResultParser(
        this.resultsDir,
        stepParser,
        attachmentParser,
      );
  }

  /**
   * Parse toàn bộ allure-results.
   */
  async parse(): Promise<
    ParsedAllureResult[]
  > {
    /**
     * Validate directory.
     */
    await this.assertDirectory();

    /**
     * Scan files.
     */
    const files =
      await readdir(
        this.resultsDir,
        {
          withFileTypes: true,
        },
      );

    /**
     * Chỉ lấy:
     *
     *     xxx-result.json
     */
    const resultFiles = files
      .filter(
        file =>
          file.isFile() &&
          file.name.endsWith(
            "-result.json",
          ),
      )
      .map(
        file => file.name,
      );

    /**
     * Parse từng result file.
     */
    const results =
      await Promise.all(
        resultFiles.map(
          file =>
            this.resultParser.parse(
              file,
            ),
        ),
      );

    /**
     * Sort theo start.
     *
     * Không dùng:
     *
     *     a.start - b.start
     *
     * trực tiếp vì start có thể null/undefined.
     */
    results.sort((a, b) => {
      const aStart =
        typeof a.start === "number"
          ? a.start
          : Number.MAX_SAFE_INTEGER;

      const bStart =
        typeof b.start === "number"
          ? b.start
          : Number.MAX_SAFE_INTEGER;

      return aStart - bStart;
    });

    return results;
  }

  /**
   * Validate directory.
   */
  private async assertDirectory(): Promise<void> {
    let info;

    try {
      info = await stat(
        this.resultsDir,
      );
    } catch {
      throw new Error(
        `Allure results directory does not exist: ${this.resultsDir}`,
      );
    }

    if (!info.isDirectory()) {
      throw new Error(
        `Allure results path is not a directory: ${this.resultsDir}`,
      );
    }
  }
}
```

---

 # 7\. `index.ts`

 Để import cho đẹp:

```
// src/allure/index.ts

export * from "./types/allure.types";

export * from "./types/parsed.types";

export * from "./parsers/allure-attachment.parser";

export * from "./parsers/allure-step.parser";

export * from "./parsers/allure-result.parser";

export * from "./allure-results.parser";
```

 Sau đó bên ngoài chỉ cần:

```
import {
  AllureResultsParser,
} from "./allure";

const parser =
  new AllureResultsParser(
    "./allure-results",
  );

const results =
  await parser.parse();

console.log(results);
```

---

 ## Điểm mình thích ở architecture này

 Bây giờ trách nhiệm rất rõ:

 | File | Responsibility |
| --- | --- |
| `allure.types.ts` | Raw Allure schema |
| `parsed.types.ts` | Model sau khi parse |
| `allure-attachment.parser.ts` | Resolve attachment |
| `allure-step.parser.ts` | Parse recursive steps |
| `allure-result.parser.ts` | Parse **1 result JSON** |
| `allure-results.parser.ts` | Scan toàn bộ folder + orchestrate |
| `index.ts` | Public API |

Và quan trọng nhất là **mỗi result JSON được quản lý độc lập**:

```
allure-results/
│
├── A-result.json
│       │
│       └── AllureResultParser
│               │
│               ├── StepParser
│               └── AttachmentParser
│
├── B-result.json
│       │
│       └── AllureResultParser
│               │
│               ├── StepParser
│               └── AttachmentParser
│
└── C-result.json
        │
        └── AllureResultParser
                │
                ├── StepParser
                └── AttachmentParser
```

 Sau này khi làm DB, architecture cũng rất thuận:

```
AllureResultsParser
        │
        ▼
ParsedAllureResult[]
        │
        ├───────────────┐
        ▼               ▼
 TestResultMapper   AttachmentMapper
        │               │
        ▼               ▼
   test_results    attachments
        │
        ▼
      steps
```

 **Đặc biệt, từ đây mình sẽ không cho `AllureResultsParser` biết chi tiết về `steps` hay `attachments` nữa.** Nó chỉ orchestrate. Điều này sẽ giúp khi schema Allure thay đổi hoặc sau này muốn thêm `history`, `environment`, `executor`, `categories` thì không biến parser chính thành một file vài trăm dòng.