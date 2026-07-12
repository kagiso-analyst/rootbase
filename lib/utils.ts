// lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ===== TAILWIND UTILITY =====
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== DATE UTILITIES =====
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diff = d2.getTime() - d1.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

export function getWeekStart(date: string | Date = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  return new Date(d.setDate(diff))
}

export function getWeekEnd(date: string | Date = new Date()): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

export function getMonthStart(date: string | Date = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function getMonthEnd(date: string | Date = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

// ===== STRING UTILITIES =====
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ===== NUMBER UTILITIES =====
export function toNumber(value: any, fallback: number = 0): number {
  const num = parseFloat(value)
  return isNaN(num) ? fallback : num
}

export function toPercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// ===== ARRAY UTILITIES =====
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

// ===== FILE UTILITIES =====
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ===== COLOR UTILITIES =====
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    planned: 'bg-blue-100 text-blue-700',
    harvested: 'bg-purple-100 text-purple-700',
    failed: 'bg-red-100 text-red-700',
    todo: 'bg-gray-100 text-gray-600',
    done: 'bg-green-100 text-green-700',
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
    sold: 'bg-blue-100 text-blue-700',
    deceased: 'bg-red-100 text-red-700',
    culled: 'bg-gray-100 text-gray-600',
  }
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-600'
}

// ===== VALIDATION UTILITIES =====
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone)
}

// ===== RANDOM UTILITIES =====
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

// ===== EXPORT ALL =====
export default {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  daysBetween,
  isOverdue,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  capitalize,
  truncate,
  slugify,
  toNumber,
  toPercentage,
  groupBy,
  sumBy,
  getFileExtension,
  formatFileSize,
  getStatusColor,
  isValidEmail,
  isValidPhone,
  generateId,
  generateUUID,
}