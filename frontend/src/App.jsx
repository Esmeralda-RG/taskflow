import { useState } from 'react'
import { useAuth } from './contexts/AuthContext.jsx'
import { Mail, Lock } from 'lucide-react'

function App() {
  const { user, logout, login } = useAuth();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if(data.success) {
        login(data.user, data.token)
      } else {
        setError(data.message || 'Credenciales inválidas')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout()
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#efeff2] flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center">

          <div className="mb-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#5B5CF0] mb-2"></div>

            <span className="text-xs font-semibold tracking-wide text-gray-700">
              TASKFLOW
            </span>
          </div>

          <div className="w-full bg-white rounded-2xl px-8 py-10 shadow-sm">

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Bienvenido!
              </h1>

              <p className="text-lg font-medium text-gray-700">
                {user.name || user.email}
              </p>

              <p className="text-sm text-[#5B5CF0] mt-1">
                Rol: {user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#efeff2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        <div className="mb-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-[#5B5CF0] mb-2"></div>
          <span className="text-xs font-semibold tracking-wide text-gray-700">
            TASKFLOW
          </span>
        </div>

        <div className="w-full bg-white rounded-2xl px-8 py-10 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div>
              <label className="block text-[13px] text-gray-700 mb-2">
                Correo electrónico
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taskflow.com"
                  required
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-gray-700 mb-2">
                Contraseña
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-200 text-red-600 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium transition"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App

