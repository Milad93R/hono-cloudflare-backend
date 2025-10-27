import mongoose from 'mongoose'
import { Bindings } from '../types'

// Global connection cache
let cachedConnection: typeof mongoose | null = null

export class MongooseService {
  private mongoUri: string

  constructor(env: Bindings) {
    this.mongoUri = env.MONGODB_URI || ''
  }

  /**
   * Connect to MongoDB using Mongoose
   */
  async connect(): Promise<typeof mongoose> {
    if (!this.mongoUri) {
      throw new Error('MONGODB_URI is not configured')
    }

    // Reuse cached connection
    if (cachedConnection && cachedConnection.connection.readyState === 1) {
      console.log('Reusing cached Mongoose connection')
      return cachedConnection
    }

    try {
      console.log('Creating new Mongoose connection')
      
      const connection = await mongoose.connect(this.mongoUri, {
        bufferCommands: false,
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
      })
      
      cachedConnection = connection
      console.log('Successfully connected to MongoDB via Mongoose')
      return connection
    } catch (error) {
      console.error('Mongoose connection error:', error)
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a Mongoose model dynamically
   */
  getModel<T = any>(collectionName: string): mongoose.Model<T> {
    // Check if model already exists
    if (mongoose.models[collectionName]) {
      return mongoose.models[collectionName] as mongoose.Model<T>
    }

    // Create a generic schema
    const schema = new mongoose.Schema({}, { strict: false, collection: collectionName })
    return mongoose.model<T>(collectionName, schema)
  }

  /**
   * Insert a document
   */
  async insertOne<T = any>(collectionName: string, document: any): Promise<{ insertedId: string }> {
    await this.connect()
    const Model = this.getModel<T>(collectionName)
    const result = await Model.create(document)
    return { insertedId: result._id.toString() }
  }

  /**
   * Find documents
   */
  async find<T = any>(collectionName: string, query: any = {}, limit: number = 100): Promise<T[]> {
    await this.connect()
    const Model = this.getModel<T>(collectionName)
    const documents = await Model.find(query).limit(limit).lean()
    return documents as T[]
  }

  /**
   * Find one document
   */
  async findOne<T = any>(collectionName: string, query: any): Promise<T | null> {
    await this.connect()
    const Model = this.getModel<T>(collectionName)
    const document = await Model.findOne(query).lean()
    return document as T | null
  }

  /**
   * Find document by ID
   */
  async findById<T = any>(collectionName: string, id: string): Promise<T | null> {
    await this.connect()
    const Model = this.getModel<T>(collectionName)
    const document = await Model.findById(id).lean()
    return document as T | null
  }

  /**
   * Update a document
   */
  async updateOne(collectionName: string, query: any, update: any): Promise<{ modifiedCount: number }> {
    await this.connect()
    const Model = this.getModel(collectionName)
    const result = await Model.updateOne(query, { $set: update })
    return { modifiedCount: result.modifiedCount }
  }

  /**
   * Update document by ID
   */
  async updateById(collectionName: string, id: string, update: any): Promise<{ modifiedCount: number }> {
    await this.connect()
    const Model = this.getModel(collectionName)
    const result = await Model.findByIdAndUpdate(id, { $set: update })
    return { modifiedCount: result ? 1 : 0 }
  }

  /**
   * Delete a document
   */
  async deleteOne(collectionName: string, query: any): Promise<{ deletedCount: number }> {
    await this.connect()
    const Model = this.getModel(collectionName)
    const result = await Model.deleteOne(query)
    return { deletedCount: result.deletedCount || 0 }
  }

  /**
   * Delete document by ID
   */
  async deleteById(collectionName: string, id: string): Promise<{ deletedCount: number }> {
    await this.connect()
    const Model = this.getModel(collectionName)
    const result = await Model.findByIdAndDelete(id)
    return { deletedCount: result ? 1 : 0 }
  }

  /**
   * Count documents
   */
  async count(collectionName: string, query: any = {}): Promise<number> {
    await this.connect()
    const Model = this.getModel(collectionName)
    return await Model.countDocuments(query)
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    await this.connect()
    const collections = await mongoose.connection.db.listCollections().toArray()
    return collections.map(col => col.name)
  }
}
