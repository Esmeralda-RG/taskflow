import { useState } from 'react'
import {
  FolderKanban,
  Kanban,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  UserPlus,
  Users,
} from 'lucide-react'
import { useAuth } from './contexts/AuthContext.jsx'
import UserManagement from './components/UserManagement.jsx'
import ProjectManagement from './components/ProjectManagement.jsx'
import ProjectMemberManagement from './components/ProjectMemberManagement.jsx'
import KanbanBoard from './components/KanbanBoard.jsx'
import ConfirmModal from './components/ui/ConfirmModal.jsx';

const roleLabels = {
  ADMIN: 'Administrador',
  LEADER: 'Lider',
  EXECUTOR: 'Ejecutor',
}

const roleDescriptions = {
  ADMIN: 'Puedes administrar usuarios, proyectos, miembros y tareas.',
  LEADER: 'Puedes gestionar proyectos, asignar miembros y revisar tareas.',
  EXECUTOR: 'Puedes consultar y trabajar las tareas asignadas.',
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return (parts[0] || 'TF').slice(0, 2).toUpperCase()
}

function UserAvatar({ user, size = 'h-10 w-10' }) {
  return (
    <div
      className={`${size} grid shrink-0 place-items-center rounded-full bg-[#5B5CF0] text-sm font-bold text-white ring-2 ring-white`}
      title={user.name || user.email}
    >
      {getInitials(user.name || user.email)}
    </div>
  )
}

function ModuleButton({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-32 flex-col items-start justify-between rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef0ff] text-[#5B5CF0]">
        <Icon size={21} />
      </div>

      <div className="mt-6">
        <h3 className="text-base font-bold text-[#17144a]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </button>
  )
}

function Shell({ user, activeView, setActiveView, onLogout, children }) {
  const canManageProjects = ['ADMIN', 'LEADER'].includes(user?.role)
  const navItems = [
    { key: 'home', label: 'Inicio', icon: LayoutDashboard, show: true },
    { key: 'kanban', label: 'Kanban', icon: Kanban, show: true },
    { key: 'projects', label: 'Proyectos', icon: FolderKanban, show: canManageProjects },
    { key: 'members', label: 'Miembros', icon: UserPlus, show: canManageProjects },
    { key: 'users', label: 'Usuarios', icon: Users, show: user.role === 'ADMIN' },
  ].filter((item) => item.show)

  return (
    <div className="min-h-screen bg-[#efeff2]">
      <header className="sticky top-0 z-20 h-14 bg-[#4A4BDB] px-5 text-white shadow-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-xs font-black ring-1 ring-white/20">
              TF
            </div>
            <span className="text-sm font-semibold">
              TaskFlow
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-medium">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-300">
                {roleLabels[user.role] || user.role}
              </p>
            </div>

            <UserAvatar user={user} />

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="grid h-9 w-9 place-items-center rounded-full text-gray-200 hover:bg-white/10"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[78px_1fr]">
        <aside className="sticky top-14 z-10 flex h-16 items-center justify-center gap-2 bg-[#f7f7fb] px-3 lg:h-[calc(100vh-3.5rem)] lg:flex-col lg:justify-start lg:gap-4 lg:py-24">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
              title={item.label}
              aria-label={item.label}
              className={`grid h-11 w-11 place-items-center rounded-xl transition ${activeView === item.key
                ? 'bg-[#5B5CF0] text-white shadow-lg shadow-indigo-200'
                : 'text-[#62668c] hover:bg-white hover:text-[#17144a]'
                }`}
            >
              <item.icon size={19} />
            </button>
          ))}
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          {activeView !== 'home' && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B5CF0]">
                  TaskFlow
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-[#17144a] shadow-sm hover:bg-gray-50"
              >
                Volver al inicio
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

function Home({ user, setActiveView }) {
  const canManageProjects = ['ADMIN', 'LEADER'].includes(user?.role)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="h-16 w-16" />
            <div>
              <p className="text-sm font-semibold text-[#5B5CF0]">
                {roleLabels[user.role] || user.role}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#17144a]">
                Hola, {user.name || user.email}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {roleDescriptions[user.role]}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[#17144a]">
          ¿Qué puedes hacer?
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ModuleButton
            icon={Kanban}
            title="Tablero Kanban"
            description="Ver y gestionar tareas desde el tablero del proyecto."
            onClick={() => setActiveView('kanban')}
          />

          {canManageProjects && (
            <ModuleButton
              icon={FolderKanban}
              title="Gestionar proyectos"
              description="Crear, editar y revisar los proyectos registrados."
              onClick={() => setActiveView('projects')}
            />
          )}

          {canManageProjects && (
            <ModuleButton
              icon={UserPlus}
              title="Asignar miembros"
              description="Vincular usuarios a los proyectos correspondientes."
              onClick={() => setActiveView('members')}
            />
          )}

          {user.role === 'ADMIN' && (
            <ModuleButton
              icon={Users}
              title="Gestionar usuarios"
              description="Administrar cuentas y roles de los usuarios."
              onClick={() => setActiveView('users')}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function App() {
  const { user, logout, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('home')
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
        setActiveView('home')
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
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setActiveView('home');
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (user) {
    const views = {
      home: <Home user={user} setActiveView={setActiveView} />,
      kanban: <KanbanBoard />,
      projects: ['ADMIN', 'LEADER'].includes(user.role) ? <ProjectManagement /> : null,
      members: ['ADMIN', 'LEADER'].includes(user.role) ? <ProjectMemberManagement /> : null,
      users: user.role === 'ADMIN' ? <UserManagement /> : null,
    }

    return (
      <>
        <Shell
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
        >
          {views[activeView] || views.home}
        </Shell>

        <ConfirmModal
          isOpen={showLogoutModal}
          title="Cerrar sesión"
          message="¿Estás seguro de que deseas cerrar sesión?"
          confirmText="Cerrar sesión"
          cancelText="Cancelar"
          danger
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#efeff2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center">

        <div className="w-12 h-12 rounded-xl bg-[#5B5CF0] mb-10" />

        <div className="w-full bg-white rounded-2xl px-8 py-10 shadow-sm">

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="block text-sm mb-2"
              >
                Correo
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 text-gray-400" size={18} />
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-11 rounded-xl bg-gray-100"
                  placeholder="admin@taskflow.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 text-gray-400" size={18} />
                <input
                  id="password"
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
              className="w-full h-11 rounded-xl bg-[#5B5CF0] text-white disabled:opacity-70"
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
