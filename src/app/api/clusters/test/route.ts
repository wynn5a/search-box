import { NextResponse } from 'next/server'
import { OpenSearchClient } from '@/lib/opensearch'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = OpenSearchClient.getInstance(body)
    const isConnected = await client.testConnection()

    return NextResponse.json({ success: isConnected })
  } catch (error) {
    console.error('Error testing cluster connection:', error)
    return NextResponse.json(
      { error: 'Failed to test cluster connection' },
      { status: 500 }
    )
  }
} 