import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { apiToken } = await request.json()

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API токен обов\'язковий' },
        { status: 400 }
      )
    }

    // Тестуємо підключення до Монобанк API
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protocol: 'https',
        origin: 'api.monobank.ua',
        path: '/personal/client-info',
        method: 'GET',
        headers: {
          'X-Token': apiToken,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Неправильний токен або помилка API',
          details: data.errorDescription || 'Невідома помилка'
        },
        { status: 400 }
      )
    }

    // Успішна відповідь
    return NextResponse.json({
      success: true,
      message: 'Підключення до Монобанк успішне!',
      clientInfo: {
        name: data.name,
        webHookUrl: data.webHookUrl,
        permissions: data.permissions
      }
    })

  } catch (error) {
    console.error('Monobank test error:', error)
    return NextResponse.json(
      { error: 'Помилка при тестуванні підключення' },
      { status: 500 }
    )
  }
}
