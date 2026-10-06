import type { AllureLink } from "../types/allure.types";
import type { ParsedAllureLink } from "../types/parsed.types";

export class AllureLinkParser {
  parse(link: AllureLink): ParsedAllureLink {
    return {
      name: link.name ?? link.url ?? null,
      url: link.url ?? null,
      type: link.type ?? null,
    };
  }

  parseMany(links: AllureLink[]): ParsedAllureLink[] {
    return links.map((link) => this.parse(link));
  }
}
