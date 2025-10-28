import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient, ObjectId } from 'mongodb'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { collection, id } = req.query
  
  if (!collection || typeof collection !== 'string') {
    return res.status(400).json({ error: 'Collection name required' })
  }
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Document ID required' })
  }

  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI not configured' })
    }
    
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    })
    
    await client.connect()
    const db = client.db()
    
    if (req.method === 'GET') {
      // Get document by ID
      const document = await db.collection(collection).findOne({ _id: new ObjectId(id) })
      
      await client.close()
      
      if (!document) {
        return res.status(404).json({
          error: 'Document not found',
          collection,
          id
        })
      }
      
      return res.status(200).json({
        collection,
        document,
        timestamp: new Date().toISOString()
      })
    }
    
    if (req.method === 'PUT') {
      // Update document
      const body = req.body
      const result = await db.collection(collection).updateOne(
        { _id: new ObjectId(id) },
        { $set: body }
      )
      
      await client.close()
      
      if (result.modifiedCount === 0) {
        return res.status(404).json({
          error: 'Document not found or no changes made',
          collection,
          id
        })
      }
      
      return res.status(200).json({
        message: 'Document updated',
        collection,
        id,
        modifiedCount: result.modifiedCount,
        timestamp: new Date().toISOString()
      })
    }
    
    if (req.method === 'DELETE') {
      // Delete document
      const result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) })
      
      await client.close()
      
      if (result.deletedCount === 0) {
        return res.status(404).json({
          error: 'Document not found',
          collection,
          id
        })
      }
      
      return res.status(200).json({
        message: 'Document deleted',
        collection,
        id,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      })
    }
    
    await client.close()
    return res.status(405).json({ error: 'Method not allowed' })
    
  } catch (error) {
    return res.status(500).json({
      error: 'Database operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
