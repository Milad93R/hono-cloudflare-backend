import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { collection } = req.query
  
  if (!collection || typeof collection !== 'string') {
    return res.status(400).json({ error: 'Collection name required' })
  }

  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI not configured' })
    }
    
    const { query = {}, limit = 100 } = req.body
    
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    })
    
    await client.connect()
    const db = client.db()
    
    const documents = await db.collection(collection).find(query).limit(limit).toArray()
    const count = await db.collection(collection).countDocuments(query)
    
    await client.close()
    
    return res.status(200).json({
      collection,
      query,
      documents,
      returned: documents.length,
      total: count,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return res.status(500).json({
      error: 'Query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
