import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { collection } = req.query
  
  if (!collection || typeof collection !== 'string') {
    return res.status(400).json({ error: 'Collection name required' })
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
      // Get all documents
      const limit = parseInt(req.query.limit as string || '100')
      const documents = await db.collection(collection).find({}).limit(limit).toArray()
      const count = await db.collection(collection).countDocuments()
      
      await client.close()
      return res.status(200).json({
        collection,
        documents,
        returned: documents.length,
        total: count,
        timestamp: new Date().toISOString()
      })
    }
    
    if (req.method === 'POST') {
      // Create document
      const body = req.body
      const result = await db.collection(collection).insertOne(body)
      
      await client.close()
      return res.status(201).json({
        message: 'Document created',
        collection,
        insertedId: result.insertedId.toString(),
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
