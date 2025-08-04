'use client'

import { useState, useEffect } from 'react'

interface Budget {
  id: string
  totalBudget: number
  endDate: string
  dailyLimit: number
  createdAt: string
}

interface Expense {
  id: string
  amount: number
  note: string | null
  createdAt: string
  isFromMonobank: boolean
  merchantName: string | null
}

export default function HomePage() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseNote, setNewExpenseNote] = useState('')

  // Завантаження даних
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Завантажуємо бюджет
      const budgetRes = await fetch('/api/budget')
      const budgetData = await budgetRes.json()
      setBudget(budgetData.budget)

      // Завантажуємо витрати
      const expensesRes = await fetch('/api/expenses')
      const expensesData = await expensesRes.json()
      setExpenses(expensesData.expenses || [])
    } catch (error) {
      console.error('Помилка завантаження:', error)
    } finally {
      setLoading(false)
    }
  }

  // Створення бюджету
  const createBudget = async () => {
    const totalBudget = prompt('Введіть загальний бюджет (грн):')
    const days = prompt('На скільки днів? (наприклад: 30)')
    
    if (!totalBudget || !days) return

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + parseInt(days))
    
    const dailyLimit = parseFloat(totalBudget) / parseInt(days)

    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudget: parseFloat(totalBudget),
          endDate: endDate.toISOString(),
          dailyLimit
        })
      })

      if (res.ok) {
        loadData()
        alert('Бюджет створено!')
      }
    } catch (error) {
      alert('Помилка створення бюджету')
    }
  }

  // Додавання витрати
  const addExpense = async () => {
    if (!newExpenseAmount) return

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newExpenseAmount),
          note: newExpenseNote || null
        })
      })

      if (res.ok) {
        setNewExpenseAmount('')
        setNewExpenseNote('')
        loadData()
        alert('Витрата додана!')
      }
    } catch (error) {
      alert('Помилка додавання витрати')
    }
  }

  // Видалення витрати
  const deleteExpense = async (id: string) => {
    if (!confirm('Видалити цю витрату?')) return

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadData()
        alert('Витрата видалена!')
      }
    } catch (error) {
      alert('Помилка видалення')
    }
  }

  // Розрахунки
  const todayExpenses = expenses.filter(exp => {
    const today = new Date().toDateString()
    const expDate = new Date(exp.createdAt).toDateString()
    return today === expDate
  })

  const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (loading) return <div className="p-4">Завантаження...</div>

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Заголовок */}
      <div className="bg-blue-600 text-white p-4 text-center">
        <h1 className="text-xl font-bold">💰 Spendly</h1>
        <p className="text-sm opacity-90">Контроль особистих фінансів</p>
      </div>

      {/* Бюджет */}
      {!budget ? (
        <div className="p-4 text-center">
          <p className="mb-4">Створіть свій перший бюджет</p>
          <button 
            onClick={createBudget}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Створити бюджет
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-50">
          <h2 className="font-bold mb-2">📊 Поточний бюджет</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Загальний: {budget.totalBudget} ₴</div>
            <div>Витрачено: {totalSpent} ₴</div>
            <div>Щоденний ліміт: {budget.dailyLimit.toFixed(0)} ₴</div>
            <div>Сьогодні: {todayTotal} ₴</div>
          </div>
          <div className="mt-2">
            <div className="bg-gray-200 h-2 rounded">
              <div 
                className="bg-blue-500 h-2 rounded"
                style={{ width: `${Math.min(100, (totalSpent / budget.totalBudget) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Додавання витрати */}
      <div className="p-4 border-b">
        <h3 className="font-bold mb-2">➕ Додати витрату</h3>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Сума (₴)"
            value={newExpenseAmount}
            onChange={(e) => setNewExpenseAmount(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Примітка (опціонально)"
            value={newExpenseNote}
            onChange={(e) => setNewExpenseNote(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={addExpense}
            className="w-full bg-red-500 text-white p-2 rounded"
          >
            Додати витрату
          </button>
        </div>
      </div>

      {/* Список витрат */}
      <div className="p-4">
        <h3 className="font-bold mb-2">📝 Останні витрати</h3>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center">Витрат поки немає</p>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 10).map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">
                    {expense.amount} ₴
                    {expense.isFromMonobank && <span className="text-blue-500 text-xs ml-1">[Монобанк]</span>}
                  </div>
                  <div className="text-sm text-gray-600">
                    {expense.note || expense.merchantName || 'Без примітки'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(expense.createdAt).toLocaleString('uk-UA')}
                  </div>
                </div>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="text-red-500 text-sm"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Простий Монобанк */}
      <div className="p-4 bg-blue-50">
        <button 
          onClick={() => alert('Монобанк інтеграція буде доступна після повного деплою!')}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          🏦 Підключити Монобанк
        </button>
      </div>
    </div>
  )
}
