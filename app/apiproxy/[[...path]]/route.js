// API Proxy route to handle routing issues
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    // Forward the request to the actual API
    const path = params.path ? params.path.join('/') : ''
    const url = new URL(`http://localhost:3000/api/${path}`, request.url)
    
    // Copy query parameters
    const searchParams = new URL(request.url).searchParams
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value)
    })
    
    console.log(`[API PROXY] Forwarding GET request to: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers)
      }
    })
    
    const data = await response.json()
    
    const proxyResponse = NextResponse.json(data, { status: response.status })
    
    // Add CORS headers
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*')
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    return proxyResponse
  } catch (error) {
    console.error('[API PROXY] Error:', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    // Forward the request to the actual API
    const path = params.path ? params.path.join('/') : ''
    const url = new URL(`http://localhost:3000/api/${path}`, request.url)
    
    console.log(`[API PROXY] Forwarding POST request to: ${url.toString()}`)
    
    const body = await request.text()
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers)
      },
      body: body
    })
    
    const data = await response.json()
    
    const proxyResponse = NextResponse.json(data, { status: response.status })
    
    // Add CORS headers
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*')
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    return proxyResponse
  } catch (error) {
    console.error('[API PROXY] Error:', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
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