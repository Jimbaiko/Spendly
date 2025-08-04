import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

// DELETE - видалити витрату по ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params

    // Перевіряємо, чи існує витрата
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Витрата не знайдена' },
        { status: 404 }
      )
    }

    // Видаляємо витрату
    await prisma.expense.delete({
      where: { id }
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
    
    const todayAmount = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Загальна статистика
    const allExpenses = await prisma.expense.findMany()
    const totalAmount = allExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Статистика по джерелах
    const manualCount = allExpenses.filter(e => !e.isFromMonobank).length
    const monobankCount = allExpenses.filter(e => e.isFromMonobank).length

    return NextResponse.json({
      message: existingExpense.isFromMonobank 
        ? 'Витрата з Монобанка видалена' 
        : 'Витрата успішно видалена',
      deletedExpense: {
        id: existingExpense.id,
        amount: existingExpense.amount,
        note: existingExpense.note,
        isFromMonobank: existingExpense.isFromMonobank,
        merchantName: existingExpense.merchantName
      },
      updatedStats: {
        total: totalAmount,
        today: todayAmount,
        count: allExpenses.length,
        todayCount: todayExpenses.length,
        sources: {
          manual: manualCount,
          monobank: monobankCount
        }
      }
    })

  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Помилка при видаленні витрати' },
      { status: 500 }
    )
  }
}

// GET - отримати конкретну витрату по ID (опціонально)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params

    const expense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Витрата не знайдена' },
        { status: 404 }
      )
    }

    return NextResponse.json({ expense })

  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Помилка при отриманні витрати' },
      { status: 500 }
    )
  }
}

// PUT - оновити витрату (опціонально для майбутнього)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params
    const body = await request.json()

    // Перевіряємо, чи існує витрата
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Витрата не знайдена' },
        { status: 404 }
      )
    }

    // Оновлюємо тільки дозволені поля
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        amount: body.amount || existingExpense.amount,
        note: body.note !== undefined ? body.note : existingExpense.note,
        // Монобанк поля не можна редагувати
      }
    })

    return NextResponse.json({
      expense: updatedExpense,
      message: 'Витрата успішно оновлена'
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Помилка при оновленні витрати' },
      { status: 500 }
    )
  }
}
