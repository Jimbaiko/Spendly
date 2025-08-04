import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { startOfDay, endOfDay } from 'date-fns'

// Схема валідації для нової витрати
const expenseSchema = z.object({
  amount: z.number().positive('Сума має бути позитивною'),
  note: z.string().optional(),
  // Поля для Монобанка (опціонально)
  monobankId: z.string().optional(),
  isFromMonobank: z.boolean().default(false),
  merchantName: z.string().optional(),
  merchantType: z.string().optional(),
  categoryCode: z.string().optional(),
  transactionTime: z.string().datetime().optional(),
  cardType: z.string().optional(),
})

// GET - отримати список витрат
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'today' або 'all'

    let whereClause = {}

    // Фільтр за сьогоднішнім днем
    if (filter === 'today') {
      const today = new Date()
      whereClause = {
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        }
      }
    }

    // Отримуємо витрати з сортуванням за датою (нові спочатку)
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Підрахунок статистики
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    const todayExpenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        }
      }
    })
    
    const todayAmount = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Статистика по джерелах
    const manualCount = expenses.filter(e => !e.isFromMonobank).length
    const monobankCount = expenses.filter(e => e.isFromMonobank).length

    return NextResponse.json({
      expenses,
      stats: {
        total: totalAmount,
        today: todayAmount,
        count: expenses.length,
        todayCount: todayExpenses.length,
        sources: {
          manual: manualCount,
          monobank: monobankCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Помилка при отриманні витрат' },
      { status: 500 }
    )
  }
}

// POST - додати нову витрату
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = expenseSchema.parse(body)

    // Перевіряємо, чи не існує вже витрата з таким monobankId
    if (validatedData.monobankId) {
      const existingExpense = await prisma.expense.findUnique({
        where: { monobankId: validatedData.monobankId }
      })

      if (existingExpense) {
        return NextResponse.json(
          { error: 'Ця транзакція вже була додана' },
          { status: 409 } // Conflict
        )
      }
    }

    // Створюємо нову витрату
    const expense = await prisma.expense.create({
      data: {
        amount: validatedData.amount,
        note: validatedData.note || null,
        monobankId: validatedData.monobankId || null,
        isFromMonobank: validatedData.isFromMonobank,
        merchantName: validatedData.merchantName || null,
        merchantType: validatedData.merchantType || null,
        categoryCode: validatedData.categoryCode || null,
        transactionTime: validatedData.transactionTime 
          ? new Date(validatedData.transactionTime) 
          : null,
        cardType: validatedData.cardType || null,
      }
    })

    // Отримуємо оновлену статистику для сьогодні
    const todayExpenses = await prisma.expense.findMany({
      where: {
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        }
      }
    })
    
    const todayAmount = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    return NextResponse.json({
      expense,
      todayTotal: todayAmount,
      message: validatedData.isFromMonobank 
        ? 'Витрата з Монобанка додана' 
        : 'Витрата успішно додана'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неправильні дані', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Помилка при створенні витрати' },
      { status: 500 }
    )
  }
}
