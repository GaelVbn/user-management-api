class AppError extends Error {
  public status: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.status = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
