import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MongoClient } from 'mongodb'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: Re-enable API key check after testing
  // const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key']
  // if (apiKey !== process.env.API_KEY) {
  //   return res.status(401).json({ error: 'Unauthorized' })
  // }

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
    const collections = await db.listCollections().toArray()
    await client.close()
    
    res.status(200).json({
      collections: collections.map(c => c.name),
      count: collections.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list collections',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
