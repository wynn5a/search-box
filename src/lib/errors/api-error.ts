export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static notFound(message: string = 'Resource not found') {
    return new ApiError(message, 404)
  }

  static badRequest(message: string = 'Bad request') {
    return new ApiError(message, 400)
  }

  static internal(message: string = 'Internal server error', details?: any) {
    return new ApiError(message, 500, details)
  }
} 