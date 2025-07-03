export interface ResultCollector<R> {
  add(record: R): void;
}
