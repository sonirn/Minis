// Single API endpoint to handle all API calls
import { NextResponse } from 'next/server'

// Import the main API handler
import { GET as APIGet, POST as APIPost } from '../api/[[...path]]/route.js'

export async function GET(request) {
  try {
    // Extract the path from query parameters
    const url = new URL(request.url)
    const path = url.searchParams.get('path') || ''
    
    console.log(`[TRX-API] GET request for path: ${path}`)
    
    // Create a mock request with the path
    const mockRequest = new Request(`http://localhost:3000/api/${path}`, {
      method: 'GET',
      headers: request.headers
    })
    
    const mockParams = { params: { path: path.split('/').filter(p => p) } }
    
    // Call the original API handler
    const response = await APIGet(mockRequest, mockParams)
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    return response
  } catch (error) {
    console.error('[TRX-API] GET Error:', error)
    return NextResponse.json({ error: 'API Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Extract the path from query parameters
    const url = new URL(request.url)
    const path = url.searchParams.get('path') || ''
    
    console.log(`[TRX-API] POST request for path: ${path}`)
    
    // Create a mock request with the path
    const body = await request.text()
    const mockRequest = new Request(`http://localhost:3000/api/${path}`, {
      method: 'POST',
      headers: request.headers,
      body: body
    })
    
    const mockParams = { params: { path: path.split('/').filter(p => p) } }
    
    // Call the original API handler
    const response = await APIPost(mockRequest, mockParams)
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    return response
  } catch (error) {
    console.error('[TRX-API] POST Error:', error)
    return NextResponse.json({ error: 'API Error' }, { status: 500 })
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  })
}