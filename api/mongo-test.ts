import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mongoUri = process.env.MONGODB_URI
    
    if (!mongoUri) {
      return res.status(500).json({
        error: 'MONGODB_URI not configured',
        env: Object.keys(process.env)
      })
    }
    
    // Try to import MongoDB
    const { MongoClient } = await import('mongodb')
    
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    })
    
    await client.connect()
    const db = client.db()
    const collections = await db.listCollections().toArray()
    await client.close()
    
    res.status(200).json({
      success: true,
      collections: collections.map(c => c.name),
      count: collections.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'MongoDB connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
