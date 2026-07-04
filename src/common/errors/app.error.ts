export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly result?: unknown;

  constructor(params?: {
    code: string;
    message: string;
    statusCode: number;
    result?: unknown;
  }) {
    super(params?.message);
    this.code = params?.code ?? "UNKNOWN";
    this.statusCode = params?.statusCode ?? 500;
    this.result = params?.result ?? null;
  }
}
