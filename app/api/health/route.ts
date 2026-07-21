import { NextResponse } from 'next/server'

const startTime = Date.now()

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  return NextResponse.json(
    { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime
    },
    { status: 200 }
  )
}