import { NextResponse } from 'next/server'
import { ApiError } from '@/lib/errors/api-error'
import { ZodError, ZodSchema } from 'zod'

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  message?: string;
}

export async function handleApiRoute<T>(
  handler: () => Promise<ApiResponse<T>>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
  }
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await handler()
    if (!result) {
      return NextResponse.json({
        success: false,
        error: "No response data"
      })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details
      }, { status: error.statusCode })
    }

    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : 500

    return NextResponse.json({
      success: false,
      error: options?.errorMessage || 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: statusCode })
  }
}

export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  body: unknown,
  errorMessage?: string
): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(
        errorMessage || 'Validation error',
        400,
        error.errors
      )
    }
    throw error
  }
}

export function validateParams<T>(
  schema: ZodSchema<T>,
  params: unknown,
  errorMessage?: string
): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(
        errorMessage || 'Invalid parameters',
        400,
        error.errors
      )
    }
    throw error
  }
} 