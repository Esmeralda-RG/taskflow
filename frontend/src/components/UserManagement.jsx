import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'LEADER'
  });
  const [message, setMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const filteredUsers =
    roleFilter === 'ALL'
      ? users
      : users.filter(user => user.role === roleFilter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`${data.message}`);
        setFormData({ email: '', password: '', name: '', role: 'LEADER' });
        fetchUsers();
      } else {
        setMessage(`${data.message}`);
      }
    } catch (err) {
      setMessage('Error de conexión');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de usuarios
        </h1>

        <p className="text-gray-500 mt-1">
          Administra usuarios y roles del sistema
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 rounded-2xl px-5 py-4 text-sm font-medium border
          ${message.includes('Error')
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Create User */}
      <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Crear nuevo usuario
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Agrega usuarios al sistema y asigna sus roles
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >

          {/* Email */}
          <div>
            <label className="block text-[13px] text-gray-700 mb-2">
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="usuario@taskflow.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-[13px] text-gray-700 mb-2">
              Nombre completo
            </label>

            <input
              type="text"
              placeholder="Juan López"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] text-gray-700 mb-2">
              Contraseña temporal
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-[13px] text-gray-700 mb-2">
              Rol
            </label>

            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
            >
              <option value="LEADER">Líder</option>
              <option value="EXECUTOR">Ejecutor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="md:col-span-2 h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium transition"
          >
            Crear usuario
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">

        <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Usuarios registrados
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Lista de usuarios disponibles en TaskFlow
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {filteredUsers.length} usuarios encontrados
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">

            <span className="text-sm text-gray-500">
              Filtrar:
            </span>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0] text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="ADMIN">Administradores</option>
              <option value="LEADER">Líderes</option>
              <option value="EXECUTOR">Ejecutores</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando usuarios...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-8 py-4 text-sm font-semibold text-gray-700">
                    Nombre
                  </th>

                  <th className="px-8 py-4 text-sm font-semibold text-gray-700">
                    Correo
                  </th>

                  <th className="px-8 py-4 text-sm font-semibold text-gray-700">
                    Rol
                  </th>

                  <th className="px-8 py-4 text-sm font-semibold text-gray-700">
                    Fecha creación
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >

                    <td className="px-8 py-5 text-sm font-medium text-gray-800">
                      {user.name}
                    </td>

                    <td className="px-8 py-5 text-sm text-gray-500">
                      {user.email}
                    </td>

                    <td className="px-8 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                        ${user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-600'
                            : user.role === 'LEADER'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement;

