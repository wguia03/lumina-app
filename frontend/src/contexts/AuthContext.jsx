import { createContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { jwtDecode } from 'jwt-decode'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const decoded = jwtDecode(token)
          if (decoded.exp * 1000 > Date.now()) {
            setUser(decoded)
            // Cargar perfil completo para avatar y nickname
            try {
              const profile = await userService.getProfile(decoded.id)
              setUser(prev => ({ ...prev, ...profile }))
            } catch (_) {
              // Si falla, mantener datos del token
            }
          } else {
            localStorage.removeItem('token')
          }
        } catch (error) {
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    const response = await authService.login(email, password)
    const { token, user: userData } = response
    localStorage.setItem('token', token)
    setUser(userData)
    return response
  }

  const register = async (userData) => {
    const response = await authService.register(userData)
    const { token, user: newUser } = response
    localStorage.setItem('token', token)
    setUser(newUser)
    return response
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
