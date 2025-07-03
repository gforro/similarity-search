import { FindSimilarTask } from "./openai/similarity-analysis-activity";
import { VectorStorage } from "./storage/types";

interface SimilartityChecker<Rec, Res> {
  execute(record: Rec): Promise<Res>;
}

interface EmbeddingCalculator<Rec> {
  execute(record: Rec): Promise<number[]>;
}

export class SimilarityAnalysis<Rec, Res> {
  constructor(
    private embeddingCalculator: EmbeddingCalculator<Rec>,
    private vectorStorage: VectorStorage<Rec>,
    private similarityChecker: SimilartityChecker<FindSimilarTask<Rec>, Res>
  ) {}

  async execute(record: Rec) {
    const vector = await this.embeddingCalculator.execute(record);
    const candidates = this.vectorStorage.lookup(vector, 3);
    const similarityResult = await this.similarityChecker.execute({
      personToEvaluate: record,
      candidates,
    });
    return similarityResult;
  }
}
