import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { apiToken, accountId, days = 7 } = await request.json()

    if (!apiToken || !accountId) {
      return NextResponse.json(
        { error: "API токен та ID рахунку обов'язкові" },
        { status: 400 }
      )
    }

    // Розраховуємо дати для синхронізації
    const toDate = Math.floor(Date.now() / 1000)
    const fromDate = toDate - days * 24 * 60 * 60

    // Отримуємо транзакції з Монобанка
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protocol: 'https',
        origin: 'api.monobank.ua',
        path: `/personal/statement/${accountId}/${fromDate}/${toDate}`,
        method: 'GET',
        headers: {
          'X-Token': apiToken,
        },
      }),
    })

    const transactions = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Помилка синхронізації',
          details: transactions.errorDescription || 'Невідома помилка',
        },
        { status: 400 }
      )
    }

    let addedCount = 0
    let skippedCount = 0
    const addedExpenses = []

    for (const transaction of transactions) {
      if (transaction.amount >= 0) {
        skippedCount++
        continue
      }

      const existingExpense = await prisma.expense.findUnique({
        where: { monobankId: transaction.id },
      })

      if (existingExpense) {
        skippedCount++
        continue
      }

      const expense = await prisma.expense.create({
        data: {
          amount: Math.abs(transaction.amount / 100),
          note: `${transaction.description}${
            transaction.comment ? ` - ${transaction.comment}` : ''
          }`,
          monobankId: transaction.id,
          isFromMonobank: true,
          merchantName: transaction.description,
          merchantType: transaction.mcc ? `MCC ${transaction.mcc}` : null,
          categoryCode: transaction.mcc?.toString(),
          transactionTime: new Date(transaction.time * 1000),
          cardType: transaction.account || null,
          createdAt: new Date(transaction.time * 1000),
        },
      })

      addedExpenses.push(expense)
      addedCount++
    }

    // ✅ Використовуємо id замість accountId у where, бо Prisma вимагає унікальне поле
    const existingSettings = await prisma.monobankSettings.findFirst({
      where: { accountId },
    })

    if (existingSettings) {
      await prisma.monobankSettings.update({
        where: { id: existingSettings.id },
        data: {
          lastSync: new Date(),
          apiToken,
          isActive: true,
        },
      })
    } else {
      await prisma.monobankSettings.create({
        data: {
          apiToken,
          accountId,
          isActive: true,
          lastSync: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Синхронізація завершена! Додано ${addedCount} нових витрат, пропущено ${skippedCount}`,
      stats: {
        added: addedCount,
        skipped: skippedCount,
        total: transactions.length,
        period: `${days} днів`,
      },
      addedExpenses: addedExpenses.slice(0, 5),
    })
  } catch (error) {
    console.error('Monobank sync error:', error)
    return NextResponse.json(
      { error: 'Помилка при синхронізації' },
      { status: 500 }
    )
  }
}
