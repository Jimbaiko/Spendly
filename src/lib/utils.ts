import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Форматування валюти
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Форматування дати
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Розрахунок днів до дати
export function daysUntil(endDate: string | Date): number {
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// Розрахунок щоденного ліміту
export function calculateDailyLimit(totalBudget: number, spent: number, endDate: string | Date): number {
  const remaining = totalBudget - spent
  const daysLeft = daysUntil(endDate)
  
  if (daysLeft <= 0) return 0
  return remaining / daysLeft
}

// Перевірка, чи витрата сьогоднішня
export function isToday(date: string | Date): boolean {
  const today = new Date()
  const checkDate = new Date(date)
  
  return today.toDateString() === checkDate.toDateString()
}

// Групування витрат по датах
export function groupExpensesByDate(expenses: any[]): Record<string, any[]> {
  return expenses.reduce((groups, expense) => {
    const date = new Date(expense.createdAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {})
}

// Валідація API токена Монобанка
export function validateMonobankToken(token: string): boolean {
  // Базова валідація токена Монобанк
  return token.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(token)
}

// Отримання назви магазину з опису транзакції
export function extractMerchantName(description: string): string {
  // Видаляємо технічну інформацію та залишаємо назву магазину
  return description
    .replace(/^\d+\s*/, '') // Видаляємо номер картки
    .replace(/\s*\d{2}\/\d{2}$/, '') // Видаляємо дату
    .replace(/\s*\d{2}:\d{2}$/, '') // Видаляємо час
    .trim()
    .substring(0, 50) // Обмежуємо довжину
}

// Кольори для категорій витрат
export function getCategoryColor(categoryCode?: string): string {
  if (!categoryCode) return 'bg-gray-100 text-gray-800'
  
  const colors: Record<string, string> = {
    '5411': 'bg-green-100 text-green-800', // Супермаркети
    '5812': 'bg-orange-100 text-orange-800', // Ресторани
    '5541': 'bg-blue-100 text-blue-800', // АЗС
    '5814': 'bg-purple-100 text-purple-800', // Фаст-фуд
    '5912': 'bg-red-100 text-red-800', // Аптеки
    '5311': 'bg-yellow-100 text-yellow-800', // Універмаги
  }
  
  return colors[categoryCode] || 'bg-gray-100 text-gray-800'
}

// Генерація кольору для прогрес-бару
export function getProgressColor(percentage: number): string {
  if (percentage <= 50) return 'bg-green-500'
  if (percentage <= 80) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Дебаунс для оптимізації
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
