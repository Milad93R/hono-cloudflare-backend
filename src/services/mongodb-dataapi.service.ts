import { Bindings } from '../types'

/**
 * MongoDB Data API Service
 * Uses MongoDB's HTTP-based Data API which works perfectly with Cloudflare Workers
 */
export class MongoDBDataAPIService {
  private apiKey: string
  private apiUrl: string
  private database: string

  constructor(env: Bindings) {
    this.apiKey = env.MONGODB_DATA_API_KEY || ''
    this.apiUrl = env.MONGODB_DATA_API_URL || ''
    this.database = env.MONGODB_DATABASE || 'test'
  }

  /**
   * Make a request to MongoDB Data API
   */
  private async request(endpoint: string, body: any): Promise<any> {
    if (!this.apiKey || !this.apiUrl) {
      throw new Error('MongoDB Data API not configured. Set MONGODB_DATA_API_KEY and MONGODB_DATA_API_URL')
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        dataSource: 'Cluster0',
        database: this.database,
        ...body,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`MongoDB Data API error: ${error}`)
    }

    return await response.json()
  }

  /**
   * Insert a document
   */
  async insertOne(collection: string, document: any): Promise<{ insertedId: string }> {
    const result = await this.request('/action/insertOne', {
      collection,
      document,
    })
    return { insertedId: result.insertedId }
  }

  /**
   * Find documents
   */
  async find(collection: string, filter: any = {}, limit: number = 100): Promise<any[]> {
    const result = await this.request('/action/find', {
      collection,
      filter,
      limit,
    })
    return result.documents || []
  }

  /**
   * Find one document
   */
  async findOne(collection: string, filter: any): Promise<any | null> {
    const result = await this.request('/action/findOne', {
      collection,
      filter,
    })
    return result.document || null
  }

  /**
   * Update a document
   */
  async updateOne(collection: string, filter: any, update: any): Promise<{ modifiedCount: number }> {
    const result = await this.request('/action/updateOne', {
      collection,
      filter,
      update: { $set: update },
    })
    return { modifiedCount: result.modifiedCount || 0 }
  }

  /**
   * Delete a document
   */
  async deleteOne(collection: string, filter: any): Promise<{ deletedCount: number }> {
    const result = await this.request('/action/deleteOne', {
      collection,
      filter,
    })
    return { deletedCount: result.deletedCount || 0 }
  }

  /**
   * Count documents
   */
  async count(collection: string, filter: any = {}): Promise<number> {
    const result = await this.request('/action/aggregate', {
      collection,
      pipeline: [
        { $match: filter },
        { $count: 'total' }
      ],
    })
    return result.documents?.[0]?.total || 0
  }

  /**
   * List collections (not supported by Data API, return empty array)
   */
  async listCollections(): Promise<string[]> {
    // MongoDB Data API doesn't support listing collections
    // Return a message instead
    throw new Error('List collections not supported by MongoDB Data API. Use MongoDB Atlas UI or native driver.')
  }
}
