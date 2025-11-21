import { auth } from "@/auth"
import { ApiError } from "@/lib/errors/api-error"

/**
 * Get the current authenticated user session
 * @throws {ApiError} If user is not authenticated
 */
export async function getUserSession() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new ApiError("Unauthorized", 401)
    }

    return session
}

/**
 * Get the current authenticated user's ID
 * @throws {ApiError} If user is not authenticated
 */
export async function getUserId(): Promise<string> {
    const session = await getUserSession()
    return session.user.id!
}
