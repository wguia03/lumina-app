export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const validateRequired = (fields, data) => {
  const missing = []
  
  for (const field of fields) {
    if (!data[field] || data[field].toString().trim() === '') {
      missing.push(field)
    }
  }
  
  return missing
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  // Remover caracteres peligrosos
  return input.trim()
    .replace(/[<>]/g, '')
}
