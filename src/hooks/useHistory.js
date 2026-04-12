import { useState, useCallback } from 'react'

const KEY = 'cifrijaner_history'
const MAX = 50

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function useHistory() {
  const [entries, setEntries] = useState(load)

  const addEntry = useCallback((unitType, cards) => {
    // Require at least 2 cards with results
    const validCards = cards.filter(c => c.result !== null)
    if (validCards.length < 2) return

    const cardData = validCards.map(c => ({
      price: Number(c.price.replace(',', '.')),
      amount: Number(c.amount.replace(',', '.')),
      unitPrice: c.result,
    }))

    const minPrice = Math.min(...cardData.map(c => c.unitPrice))
    const winnerId = cardData.findIndex(c => c.unitPrice === minPrice)

    // Duplicate guard: skip if identical to most recent entry
    setEntries(prev => {
      if (prev.length > 0) {
        const last = prev[0]
        if (
          last.unitType === unitType &&
          last.cards.length === cardData.length &&
          last.cards.every((c, i) =>
            c.price === cardData[i].price &&
            c.amount === cardData[i].amount
          )
        ) {
          return prev
        }
      }

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        savedAt: new Date().toISOString(),
        unitType,
        cards: cardData,
        winnerId,
      }

      const next = [entry, ...prev].slice(0, MAX)
      save(next)
      return next
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id)
      save(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    localStorage.removeItem(KEY)
    setEntries([])
  }, [])

  return { entries, addEntry, deleteEntry, clearAll }
}
