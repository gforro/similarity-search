import { EmbeddingCalculator } from "./embedding-process";

interface VectorStorage<Rec> {
  lookup(vector: number[], howMany: number): Rec[];
}

interface SimilartityChecker<Rec, Res> {
  execute(record: Rec): Promise<Res>;
}

interface ResultPersister<R> {
  store(record: R): Promise<void>;
}

export class SimilarityAnalysis<Rec, Res> {
  constructor(
    private embeddingCalculator: EmbeddingCalculator<Rec>,
    private vectorStorage: VectorStorage<Rec>,
    private similarityChecker: SimilartityChecker<Rec[], Res>,
    private resultPersister: ResultPersister<Res>
  ) {}

  async execute(record: Rec) {
    const vector = await this.embeddingCalculator.execute(record);
    const candidates = this.vectorStorage.lookup(vector, 3);
    const similarityResult = await this.similarityChecker.execute(candidates);
    await this.resultPersister.store(similarityResult);
  }
}
