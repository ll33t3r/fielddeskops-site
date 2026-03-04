import { passwordStrength } from 'check-password-strength'

export function evaluatePasswordStrength(password) {
  const value = password || ''
  const libraryResult = passwordStrength(value)

  const requirements = {
    length8: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  }

  const meetsCharacterRules =
    requirements.length8 &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number &&
    requirements.special

  const isStrong = meetsCharacterRules && value.length >= 12
  const isFair = meetsCharacterRules && !isStrong

  return {
    libraryScore: libraryResult.id,
    requirements,
    isAllowed: isFair || isStrong,
    level: isStrong ? 'strong' : isFair ? 'fair' : 'weak',
    label: isStrong ? 'Strong' : isFair ? 'Fair' : 'Weak',
    message: isFair || isStrong ? '' : "Password doesn't meet requirements",
  }
}
