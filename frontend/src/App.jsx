import { useState } from 'react'
import { useAuth } from './contexts/AuthContext.jsx'
import { Mail, Lock } from 'lucide-react'
import UserManagement from './components/UserManagement.jsx'
import ProjectManagement from './components/ProjectManagement.jsx'
import ProjectMemberManagement from './components/ProjectMemberManagement.jsx'

function App() {
  const { user, logout, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showMemberAssignment, setShowMemberAssignment] = useState(false)

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

      if (data.success) {
        login(data.user, data.token)
      } else {
        setError(data.message || 'Credenciales inválidas')
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (globalThis.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout()
      setShowAdminPanel(false)
      setShowProjects(false)
      setShowMemberAssignment(false)
    }
  }

  /* ADMIN PANEL */
  if (user && showAdminPanel) {
    return (
      <div className="min-h-screen bg-[#efeff2]">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">TaskFlow</h1>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>

              <button
                onClick={() => setShowAdminPanel(false)}
                className="px-4 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Volver
              </button>

              <button
                onClick={handleLogout}
                className="px-4 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <UserManagement />
          </div>
        </main>
      </div>
    )
  }

  /* PROJECTS */
  if (user && showProjects) {
    return (
      <div className="min-h-screen bg-[#efeff2]">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">TaskFlow</h1>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>

              <button
                onClick={() => setShowProjects(false)}
                className="px-4 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Volver
              </button>

              <button
                onClick={handleLogout}
                className="px-4 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <ProjectManagement />
          </div>
        </main>
      </div>
    )
  }

  /* PROJECT MEMBERS */
  if (user && showMemberAssignment) {
    return (
      <div className="min-h-screen bg-[#efeff2]">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">TaskFlow</h1>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>

              <button
                onClick={() => setShowMemberAssignment(false)}
                className="px-4 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Volver
              </button>

              <button
                onClick={handleLogout}
                className="px-4 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <ProjectMemberManagement />
          </div>
        </main>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#efeff2] flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center">

          <div className="w-12 h-12 rounded-xl bg-[#5B5CF0] mb-6" />

          <div className="w-full bg-white rounded-2xl px-8 py-10 shadow-sm text-center">

            <h1 className="text-2xl font-bold mb-2">¡Bienvenido!</h1>

            <p className="text-gray-700 font-medium">
              {user.name || user.email}
            </p>

            <p className="text-sm text-[#5B5CF0] mb-8">
              Rol: {user.role}
            </p>

            <button
              onClick={() => setShowProjects(true)}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium mb-3"
            >
              Gestionar proyectos
            </button>

            <button
              onClick={() => setShowMemberAssignment(true)}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium mb-3"
            >
              Asignar miembros a proyectos
            </button>

            {user.role === 'ADMIN' && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="w-full h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium mb-3"
              >
                Gestionar usuarios
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* LOGIN*/
  return (
    <div className="min-h-screen bg-[#efeff2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center">

        <div className="w-12 h-12 rounded-xl bg-[#5B5CF0] mb-10" />

        <div className="w-full bg-white rounded-2xl px-8 py-10 shadow-sm">

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label 
              htmlFor='email'
              className="block text-sm mb-2">Correo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 text-gray-400" size={18} />
                <input
                  id='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-11 rounded-xl bg-gray-100"
                  placeholder="admin@taskflow.com"
                />
              </div>
            </div>

            <div>
              <label 
              htmlFor='password'
              className="block text-sm mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 text-gray-400" size={18} />
                <input
                  id='password'
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-11 rounded-xl bg-gray-100"
                  placeholder="123456"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#5B5CF0] text-white"
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
