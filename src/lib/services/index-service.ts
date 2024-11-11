import { clusterService } from "./cluster-service"
import { ApiError } from "@/lib/errors/api-error"

export class IndexService {
  private static instance: IndexService

  private constructor() {}

  public static getInstance(): IndexService {
    if (!IndexService.instance) {
      IndexService.instance = new IndexService()
    }
    return IndexService.instance
  }

  public async listIndices(clusterId: string) {
    try {
      const client = await clusterService.getOpenSearchClient(clusterId)
      return client.listIndices()
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(error.message)
      }
      throw error
    }
  }

  public async createIndex(clusterId: string, name: string, settings: any) {
    try {
      const client = await clusterService.getOpenSearchClient(clusterId)
      return client.createIndex(name, settings)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(error.message)
      }
      throw error
    }
  }

  public async executeQuery(clusterId: string, params: {
    index: string
    method: string
    path: string
    body?: any
  }) {
    try {
      const client = await clusterService.getOpenSearchClient(clusterId)
      return client.executeQuery(params)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(error.message)
      }
      throw error
    }
  }
}

export const indexService = IndexService.getInstance()