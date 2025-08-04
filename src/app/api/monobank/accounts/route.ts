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

    // Отримуємо інформацію про клієнта та рахунки
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
          error: 'Помилка отримання рахунків',
          details: data.errorDescription || 'Невідома помилка'
        },
        { status: 400 }
      )
    }

    // Форматуємо рахунки для зручного відображення
    const accounts = data.accounts?.map((account: any) => ({
      id: account.id,
      sendId: account.sendId,
      balance: account.balance / 100, // Конвертуємо з копійок
      creditLimit: account.creditLimit / 100,
      type: account.type,
      currencyCode: account.currencyCode,
      cashbackType: account.cashbackType,
      maskedPan: account.maskedPan,
      iban: account.iban
    })) || []

    return NextResponse.json({
      success: true,
      clientName: data.name,
      accounts: accounts,
      message: `Знайдено ${accounts.length} рахунків`
    })

  } catch (error) {
    console.error('Monobank accounts error:', error)
    return NextResponse.json(
      { error: 'Помилка при отриманні рахунків' },
      { status: 500 }
    )
  }
}
