export class RequestDeduplicator<Result> {
  private readonly inFlight = new Map<string, Promise<Result>>();

  run(key: string, createResult: () => Promise<Result>): Promise<Result> {
    const existingResult = this.inFlight.get(key);

    if (existingResult) {
      return existingResult;
    }

    const result = createResult().finally(() => {
      if (this.inFlight.get(key) === result) {
        this.inFlight.delete(key);
      }
    });

    this.inFlight.set(key, result);

    return result;
  }
}
