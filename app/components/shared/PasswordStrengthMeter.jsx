'use client'

import { useEffect, useMemo } from 'react'
import { evaluatePasswordStrength } from '../../utils/passwordStrength'

const checklistItems = [
  { key: 'length8', label: '8+ characters' },
  { key: 'uppercase', label: 'Uppercase letter' },
  { key: 'lowercase', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special character' },
]

export default function PasswordStrengthMeter({
  password,
  onStrengthChange,
  checklistMode = 'always',
  compact = false,
}) {
  const strength = useMemo(() => evaluatePasswordStrength(password), [password])

  useEffect(() => {
    if (typeof onStrengthChange === 'function') {
      onStrengthChange(strength)
    }
  }, [onStrengthChange, strength])

  const activeSegments = strength.level === 'strong' ? 3 : strength.level === 'fair' ? 2 : 1
  const segmentClass =
    strength.level === 'strong'
      ? 'bg-green-500'
      : strength.level === 'fair'
      ? 'bg-yellow-400'
      : 'bg-red-500'
  const showChecklist =
    checklistMode === 'weak-only'
      ? Boolean(password) && strength.level === 'weak'
      : Boolean(password)

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={`h-2 flex-1 rounded ${segment <= activeSegments && password ? segmentClass : 'bg-[#333]'}`}
          />
        ))}
      </div>

      <div className="text-xs">
        <p className={`font-semibold ${strength.level === 'strong' ? 'text-green-400' : strength.level === 'fair' ? 'text-yellow-300' : 'text-red-400'}`}>
          {strength.label}
        </p>
        {strength.level === 'weak' && password ? <p className="text-red-400">{strength.message}</p> : null}
      </div>

      {showChecklist ? (
        <ul className={compact ? 'grid grid-cols-2 gap-1 text-xs text-gray-400' : 'space-y-1 text-xs text-gray-400'}>
          {checklistItems.map((item) => {
            const met = strength.requirements[item.key]
            return (
              <li key={item.key} className={met ? 'text-green-400' : 'text-gray-400'}>
                {met ? '✓' : '○'} {item.label}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
