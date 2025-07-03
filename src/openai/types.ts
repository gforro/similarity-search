export interface LLMResponse<R> {
  response: R;
  headers: Headers;
  usedToken: number;
}

export interface LLMActivity<Rec, Message, Res> {
  transform(record: Rec): Message;
  estimateToken(m: Message): number;
  callLLM(m: Message, record: Rec): Promise<LLMResponse<Res>>;
}
