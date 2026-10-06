import type {
  AllureAttachment,
  AllureLabel,
  AllureLink,
  AllureParameter,
  AllureResult,
  AllureStep,
} from "./allure.types";

export interface ParsedAllureAttachment extends AllureAttachment {
  /**
   * Absolute path tới attachment.
   */
  path: string;

  /**
   * File có tồn tại trên filesystem hay không.
   */
  exists: boolean;

  /**
   * Attachment bytes suitable for a database bytea column.
   */
  data: Buffer | null;
}

export interface ParsedAllureParameter extends Omit<AllureParameter, "exclude" | "excluded"> {
  value: string | null;
  exclude: boolean;
  mode: string | null;
}

export interface ParsedAllureLink extends AllureLink {
  name: string | null;
  url: string | null;
  type: string | null;
}

export interface ParsedAllureStep
  extends Omit<AllureStep, "steps" | "attachments" | "parameters"> {
  uuid: string;

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

  /**
   * Name stored as the database step description.
   */
  description: string;

  /**
   * Zero-based position among sibling steps.
   */
  stepOrder: number;

  /**
   * Parent step UUID used to resolve the database parent_step_id.
   */
  parentUuid: string | null;

  parameters: ParsedAllureParameter[];
}

export interface ParsedAllureResult
  extends Omit<AllureResult, "steps" | "attachments" | "parameters" | "labels" | "links"> {
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

  parameters: ParsedAllureParameter[];

  labels: AllureLabel[];

  links: ParsedAllureLink[];
}

export interface ParsedAllureRun {
  environment: string | null;
  channel: string | null;
  runDate: number | null;
  totalTest: number;
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  unknown: number;
  duration: number | null;
}
