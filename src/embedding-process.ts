import { VectorStorage } from "./storage/types";

interface EmbeddingCalculator<Rec> {
  execute(record: Rec): Promise<number[]>;
}

export class EmbeddingProcess<Rec> {
  constructor(
    private embeddingCalculator: EmbeddingCalculator<Rec>,
    private vectorStorage: VectorStorage<Rec>
  ) {}

  async execute(record: Rec): Promise<void> {
    const vector = await this.embeddingCalculator.execute(record);
    console.log(`vector calculated for ${record}`);
    this.vectorStorage.store(record, vector);
  }
}
