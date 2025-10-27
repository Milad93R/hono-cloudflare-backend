import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb'
import { Bindings } from '../types'

export class MongoDBService {
  private client: MongoClient | null = null
  private db: Db | null = null
  private mongoUri: string

  constructor(env: Bindings) {
    this.mongoUri = env.MONGODB_URI || ''
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (!this.mongoUri) {
      throw new Error('MONGODB_URI is not configured')
    }

    if (this.client) {
      return // Already connected
    }

    try {
      this.client = new MongoClient(this.mongoUri)
      await this.client.connect()
      this.db = this.client.db() // Uses default database from connection string
      console.log('Successfully connected to MongoDB')
    } catch (error) {
      console.error('MongoDB connection error:', error)
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a collection
   */
  getCollection<T extends Document = Document>(collectionName: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db.collection<T>(collectionName)
  }

  /**
   * Insert a document
   */
  async insertOne<T extends Document = Document>(collectionName: string, document: Partial<T>): Promise<{ insertedId: string }> {
    await this.connect()
    const collection = this.getCollection(collectionName)
    const result = await collection.insertOne(document as any)
    return { insertedId: result.insertedId.toString() }
  }

  /**
   * Find documents
   */
  async find<T extends Document = Document>(collectionName: string, query: any = {}, limit: number = 100): Promise<T[]> {
    await this.connect()
    const collection = this.getCollection<T>(collectionName)
    const documents = await collection.find(query).limit(limit).toArray()
    return documents as T[]
  }

  /**
   * Find one document
   */
  async findOne<T extends Document = Document>(collectionName: string, query: any): Promise<T | null> {
    await this.connect()
    const collection = this.getCollection<T>(collectionName)
    const document = await collection.findOne(query)
    return document as T | null
  }

  /**
   * Find document by ID
   */
  async findById<T extends Document = Document>(collectionName: string, id: string): Promise<T | null> {
    await this.connect()
    const collection = this.getCollection<T>(collectionName)
    const document = await collection.findOne({ _id: new ObjectId(id) } as any)
    return document as T | null
  }

  /**
   * Update a document
   */
  async updateOne(collectionName: string, query: any, update: any): Promise<{ modifiedCount: number }> {
    await this.connect()
    const collection = this.getCollection(collectionName)
    const result = await collection.updateOne(query, { $set: update })
    return { modifiedCount: result.modifiedCount }
  }

  /**
   * Update document by ID
   */
  async updateById(collectionName: string, id: string, update: any): Promise<{ modifiedCount: number }> {
    await this.connect()
    const collection = this.getCollection(collectionName)
    const result = await collection.updateOne({ _id: new ObjectId(id) } as any, { $set: update })
    return { modifiedCount: result.modifiedCount }
  }

  /**
   * Delete a document
   */
  async deleteOne(collectionName: string, query: any): Promise<{ deletedCount: number }> {
    await this.connect()
    const collection = this.getCollection(collectionName)
    const result = await collection.deleteOne(query)
    return { deletedCount: result.deletedCount }
  }

  /**
   * Delete document by ID
   */
  async deleteById(collectionName: string, id: string): Promise<{ deletedCount: number }> {
    await this.connect()
    const collection = this.getCollection(collectionName)
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as any)
    return { deletedCount: result.deletedCount }
  }

  /**
   * Count documents
   */
  async count(collectionName: string, query: any = {}): Promise<number> {
    await this.connect()
    const collection = this.getCollection(collectionName)
    return await collection.countDocuments(query)
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    await this.connect()
    if (!this.db) {
      throw new Error('Database not connected')
    }
    const collections = await this.db.listCollections().toArray()
    return collections.map(col => col.name)
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      console.log('MongoDB connection closed')
    }
  }
}
