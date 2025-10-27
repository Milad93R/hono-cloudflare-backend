import { Context } from 'hono'
import { Bindings, Variables } from '../types'
import { MongoDBService } from '../services/mongodb.service'

export class MongoDBController {
  /**
   * GET /api/mongodb/collections
   * List all collections in the database
   */
  async listCollections(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const mongoService = new MongoDBService(c.env)
      const collections = await mongoService.listCollections()

      return c.json({
        collections,
        count: collections.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error listing collections:', error)
      return c.json({
        error: 'Failed to list collections',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * GET /api/mongodb/:collection
   * Get all documents from a collection
   */
  async getDocuments(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const collection = c.req.param('collection')
      const limit = parseInt(c.req.query('limit') || '100')
      
      const mongoService = new MongoDBService(c.env)
      const documents = await mongoService.find(collection, {}, limit)
      const count = await mongoService.count(collection)

      return c.json({
        collection,
        documents,
        returned: documents.length,
        total: count,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error getting documents:', error)
      return c.json({
        error: 'Failed to get documents',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * GET /api/mongodb/:collection/:id
   * Get a document by ID
   */
  async getDocumentById(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const collection = c.req.param('collection')
      const id = c.req.param('id')
      
      const mongoService = new MongoDBService(c.env)
      const document = await mongoService.findById(collection, id)

      if (!document) {
        return c.json({
          error: 'Document not found',
          collection,
          id,
          timestamp: new Date().toISOString()
        }, 404)
      }

      return c.json({
        collection,
        document,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error getting document:', error)
      return c.json({
        error: 'Failed to get document',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * POST /api/mongodb/:collection
   * Insert a new document
   */
  async createDocument(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const collection = c.req.param('collection')
      const body = await c.req.json()
      
      const mongoService = new MongoDBService(c.env)
      const result = await mongoService.insertOne(collection, body)

      return c.json({
        message: 'Document created',
        collection,
        insertedId: result.insertedId,
        timestamp: new Date().toISOString()
      }, 201)
    } catch (error) {
      console.error('Error creating document:', error)
      return c.json({
        error: 'Failed to create document',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * PUT /api/mongodb/:collection/:id
   * Update a document by ID
   */
  async updateDocument(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const collection = c.req.param('collection')
      const id = c.req.param('id')
      const body = await c.req.json()
      
      const mongoService = new MongoDBService(c.env)
      const result = await mongoService.updateById(collection, id, body)

      if (result.modifiedCount === 0) {
        return c.json({
          error: 'Document not found or no changes made',
          collection,
          id,
          timestamp: new Date().toISOString()
        }, 404)
      }

      return c.json({
        message: 'Document updated',
        collection,
        id,
        modifiedCount: result.modifiedCount,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating document:', error)
      return c.json({
        error: 'Failed to update document',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * DELETE /api/mongodb/:collection/:id
   * Delete a document by ID
   */
  async deleteDocument(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const collection = c.req.param('collection')
      const id = c.req.param('id')
      
      const mongoService = new MongoDBService(c.env)
      const result = await mongoService.deleteById(collection, id)

      if (result.deletedCount === 0) {
        return c.json({
          error: 'Document not found',
          collection,
          id,
          timestamp: new Date().toISOString()
        }, 404)
      }

      return c.json({
        message: 'Document deleted',
        collection,
        id,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      return c.json({
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * POST /api/mongodb/:collection/query
   * Query documents with custom filter
   */
  async queryDocuments(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const collection = c.req.param('collection')
      const body = await c.req.json() as { query?: any; limit?: number }
      const query = body.query || {}
      const limit = body.limit || 100
      
      const mongoService = new MongoDBService(c.env)
      const documents = await mongoService.find(collection, query, limit)

      return c.json({
        collection,
        query,
        documents,
        count: documents.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error querying documents:', error)
      return c.json({
        error: 'Failed to query documents',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}
