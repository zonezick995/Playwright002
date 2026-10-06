import type { AllureLabel } from "../types/allure.types";

export class AllureLabelParser {
  parseMany(labels: AllureLabel[]): AllureLabel[] {
    return labels.map((label) => ({ ...label }));
  }
}
