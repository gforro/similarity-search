export interface EmbeddingCalculator<Rec> {
  execute(record: Rec): Promise<number[]>;
}

interface VectorStorage {
  store(vector: number[]): void;
}

export class EmbeddingProcess<Rec> {
  constructor(
    private embeddingCalculator: EmbeddingCalculator<Rec>,
    private vectorStorage: VectorStorage
  ) {}

  async execute(record: Rec): Promise<void> {
    const vector = await this.embeddingCalculator.execute(record);
    this.vectorStorage.store(vector);
  }
}
