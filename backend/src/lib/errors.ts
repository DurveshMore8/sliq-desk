export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export function isDuplicateKeyError(err: unknown): boolean {
  return err instanceof Error && "code" in err && err.code === 11000;
}
