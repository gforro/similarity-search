import { appendFile } from "fs/promises";
import { ResultCollector } from "./types";

export class SimilarityResultCollector implements ResultCollector<string> {
  private results: string[] = [];

  add(record: string): void {
    this.results.push(record);
  }
}
