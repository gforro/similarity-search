export interface VectorStorage<R> {
  store(record: R, vector: number[]): void;
  lookup(vector: number[], howMany: number): R[];
}
