import type { AllureParameter } from "../types/allure.types";
import type { ParsedAllureParameter } from "../types/parsed.types";

export class AllureParameterParser {
  parse(parameter: AllureParameter): ParsedAllureParameter {
    return {
      name: parameter.name,
      value: parameter.value ?? null,
      exclude: parameter.exclude ?? parameter.excluded ?? false,
      mode: parameter.mode ?? null,
    };
  }

  parseMany(parameters: AllureParameter[]): ParsedAllureParameter[] {
    return parameters.map((parameter) => this.parse(parameter));
  }
}
