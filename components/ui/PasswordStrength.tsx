'use client'

interface PasswordStrengthProps {
  password: string
}

interface StrengthResult {
  score: number   // 0–4
  label: string
  color: string
  barColor: string
}

function calcStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: '', color: '', barColor: '' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Cap at 4
  score = Math.min(score, 4)

  const levels: StrengthResult[] = [
    { score: 0, label: '', color: '', barColor: '' },
    { score: 1, label: 'ضعيفة جداً', color: 'text-red-400', barColor: 'bg-red-500' },
    { score: 2, label: 'ضعيفة', color: 'text-orange-400', barColor: 'bg-orange-500' },
    { score: 3, label: 'متوسطة', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
    { score: 4, label: 'قوية', color: 'text-[#22C55E]', barColor: 'bg-[#22C55E]' },
  ]

  return levels[score]
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const { score, label, color, barColor } = calcStrength(password)

  return (
    <div className="mt-2 space-y-1.5">
      {/* 4-segment bar */}
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? barColor : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      {/* Label */}
      {label && (
        <p className={`text-xs font-medium ${color}`}>
          قوة كلمة المرور: {label}
        </p>
      )}
    </div>
  )
}
