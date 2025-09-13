import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '100'
    
    console.log(`Fetching leaderboard data - page: ${page}, limit: ${limit}`)
    
    const response = await fetch(
      `https://api.quizrr.in/api/hiring/leaderboard?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`)
      throw new Error(`API responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('API Response received:', data.success ? 'Success' : 'Failed')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching leaderboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}
