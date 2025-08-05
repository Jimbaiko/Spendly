import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const budgetSchema = z.object({
  totalBudget: z.number().positive(),
  endDate: z.string().datetime(),
  dailyLimit: z.number().positive(),
})

export async function GET(): Promise<NextResponse> {
  try {
    const budget = await prisma.budget.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Помилка при отриманні бюджету' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = budgetSchema.parse(body)

    const budget = await prisma.budget.create({
      data: {
        totalBudget: validatedData.totalBudget,
        endDate: new Date(validatedData.endDate),
        dailyLimit: validatedData.dailyLimit,
      }
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неправильні дані', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Помилка при створенні бюджету' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = budgetSchema.parse(body)

    const currentBudget = await prisma.budget.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!currentBudget) {
      return NextResponse.json(
        { error: 'Бюджет не знайдено' },
        { status: 404 }
      )
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: currentBudget.id },
      data: {
        totalBudget: validatedData.totalBudget,
        endDate: new Date(validatedData.endDate),
        dailyLimit: validatedData.dailyLimit,
      }
    })

    return NextResponse.json({ budget: updatedBudget })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неправильні дані', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Помилка при оновленні бюджету' },
      { status: 500 }
    )
  }
} 
