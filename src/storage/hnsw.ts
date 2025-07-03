import { HierarchicalNSW } from "hnswlib-node";
import { PersonType } from "../model";
import { VectorStorage } from "./types";

export class HNSWStorage implements VectorStorage<PersonType> {
  private db: HierarchicalNSW;
  private records = new Map<number, PersonType>();

  constructor(maxElements: number) {
    this.db = new HierarchicalNSW("cosine", 1536);
    this.db.initIndex(maxElements);
  }

  store(record: PersonType, vector: number[]): void {
    const label = record.id;
    this.records.set(label, record);
    this.db.addPoint(vector, label);
  }

  lookup(vector: number[], howMany: number): PersonType[] {
    const searchResult = this.db.searchKnn(vector, howMany);
    const similarRecords = searchResult.neighbors
      .map((index) => this.records.get(index))
      .filter((r) => !!r);

    return similarRecords;
  }
}
