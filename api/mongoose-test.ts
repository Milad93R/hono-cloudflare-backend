import type { VercelRequest, VercelResponse } from '@vercel/node'
import mongoose from 'mongoose'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mongoUri = process.env.MONGODB_URI
    
    if (!mongoUri) {
      return res.status(500).json({
        error: 'MONGODB_URI not configured'
      })
    }
    
    // Try to connect with Mongoose
    await mongoose.connect(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    })
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    
    // Close connection
    await mongoose.connection.close()
    
    res.status(200).json({
      success: true,
      library: 'Mongoose',
      collections: collections.map(c => c.name),
      count: collections.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Mongoose connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
