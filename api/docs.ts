import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const baseUrl = `https://${req.headers.host}`
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.2em; opacity: 0.9; }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    .section h2 { 
      color: #667eea; 
      margin-bottom: 20px; 
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    .endpoint {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .endpoint h3 { 
      color: #333; 
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: bold;
    }
    .method.get { background: #28a745; color: white; }
    .method.post { background: #007bff; color: white; }
    .method.put { background: #ffc107; color: #333; }
    .method.delete { background: #dc3545; color: white; }
    .endpoint code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .endpoint p { margin: 10px 0; color: #666; }
    .example {
      background: #2d3748;
      color: #e2e8f0;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
      overflow-x: auto;
    }
    .example code {
      background: transparent;
      color: #68d391;
      padding: 0;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: bold;
      background: #28a745;
      color: white;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Hono API Documentation</h1>
      <p>MongoDB + Vercel Serverless Functions</p>
      <span class="status">✅ LIVE</span>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>📊 MongoDB Endpoints</h2>
        
        <div class="endpoint">
          <h3><span class="method get">GET</span> List Collections</h3>
          <code>${baseUrl}/api/mongodb/collections</code>
          <p>Get a list of all collections in the database</p>
          <div class="example">
            <code>curl "${baseUrl}/api/mongodb/collections"</code>
          </div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method get">GET</span> Get Documents</h3>
          <code>${baseUrl}/api/mongodb/[collection]</code>
          <p>Get all documents from a collection (limit: 100)</p>
          <div class="example">
            <code>curl "${baseUrl}/api/mongodb/users?limit=50"</code>
          </div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method post">POST</span> Create Document</h3>
          <code>${baseUrl}/api/mongodb/[collection]</code>
          <p>Create a new document in a collection</p>
          <div class="example">
            <code>curl -X POST "${baseUrl}/api/mongodb/users" \\<br>
  -H "Content-Type: application/json" \\<br>
  -d '{"name":"John","email":"john@example.com"}'</code>
          </div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method get">GET</span> Get Document by ID</h3>
          <code>${baseUrl}/api/mongodb/[collection]/[id]</code>
          <p>Get a specific document by its ID</p>
          <div class="example">
            <code>curl "${baseUrl}/api/mongodb/users/507f1f77bcf86cd799439011"</code>
          </div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method put">PUT</span> Update Document</h3>
          <code>${baseUrl}/api/mongodb/[collection]/[id]</code>
          <p>Update a document by its ID</p>
          <div class="example">
            <code>curl -X PUT "${baseUrl}/api/mongodb/users/507f1f77bcf86cd799439011" \\<br>
  -H "Content-Type: application/json" \\<br>
  -d '{"email":"newemail@example.com"}'</code>
          </div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method delete">DELETE</span> Delete Document</h3>
          <code>${baseUrl}/api/mongodb/[collection]/[id]</code>
          <p>Delete a document by its ID</p>
          <div class="example">
            <code>curl -X DELETE "${baseUrl}/api/mongodb/users/507f1f77bcf86cd799439011"</code>
          </div>
        </div>
        
        <div class="endpoint">
          <h3><span class="method post">POST</span> Query Documents</h3>
          <code>${baseUrl}/api/mongodb/[collection]/query</code>
          <p>Query documents with custom filters</p>
          <div class="example">
            <code>curl -X POST "${baseUrl}/api/mongodb/users/query" \\<br>
  -H "Content-Type: application/json" \\<br>
  -d '{"query":{"age":{"$gte":25}},"limit":10}'</code>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>🧪 Test Endpoints</h2>
        
        <div class="endpoint">
          <h3><span class="method get">GET</span> Simple Test</h3>
          <code>${baseUrl}/api/test</code>
          <p>Basic health check endpoint</p>
        </div>
        
        <div class="endpoint">
          <h3><span class="method get">GET</span> MongoDB Native Driver Test</h3>
          <code>${baseUrl}/api/mongo-test</code>
          <p>Test MongoDB native driver connection</p>
        </div>
        
        <div class="endpoint">
          <h3><span class="method get">GET</span> Mongoose Test</h3>
          <code>${baseUrl}/api/mongoose-test</code>
          <p>Test Mongoose connection</p>
        </div>
      </div>
      
      <div class="section">
        <h2>📝 Notes</h2>
        <div class="endpoint">
          <p>✅ MongoDB is connected and working</p>
          <p>✅ Both MongoDB native driver and Mongoose are supported</p>
          <p>⚠️ API endpoints are currently PUBLIC (no authentication)</p>
          <p>🔒 Add <code>X-API-Key</code> header for authenticated endpoints (when enabled)</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
  
  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}
