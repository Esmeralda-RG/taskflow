import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ConfirmModal from './ui/ConfirmModal.jsx';
import {
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react';

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
  const [tableMessage, setTableMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: ''
  });
  const [deleteUser, setDeleteUser] = useState(null);
  const roleLabels = {
    ADMIN: 'Administrador',
    LEADER: 'Líder',
    EXECUTOR: 'Ejecutor'
  };

  const fetchUsers = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!tableMessage) return;

    const timer = setTimeout(() => {
      setTableMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [tableMessage]);

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
    } catch {
      setMessage('Error de conexión');
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch(`http://localhost:3000/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await res.json();

      if (data.success) {
        setTableMessage(`${data.message}`);
        setEditingUser(null);
        setEditFormData({ name: '', role: '' });
        fetchUsers();
      } else {
        setTableMessage(`${data.message}`);
      }
    } catch {
      setTableMessage('Error de conexión');
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/users/${deleteUser.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {
        setTableMessage('Usuario eliminado');
        fetchUsers();
      }

      setDeleteUser(null);

    } catch {
      setTableMessage('Error de conexión');
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditFormData({ name: user.name || '', role: user.role });
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de usuarios
          </h1>

          <p className="text-gray-500 mt-1">
            Administra usuarios y roles del sistema
          </p>
        </div>

      </div>

      {/* Create User */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900">
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
            <label
              htmlFor="email"
              className="block text-[13px] text-gray-700 mb-2"
            >
              Correo electrónico
            </label>

            <input
              id="email"
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
            <label
              htmlFor='name'
              className="block text-[13px] text-gray-700 mb-2">
              Nombre completo
            </label>

            <input
              id='name'
              type="text"
              placeholder="Juan López"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor='password'
              className="block text-[13px] text-gray-700 mb-2">
              Contraseña temporal
            </label>

            <input
              id='password'
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
            <label
              htmlFor='role'
              className="block text-[13px] text-gray-700 mb-2">
              Rol
            </label>

            <div className="flex gap-2">
              {[
                { value: 'ADMIN', label: 'Admin', color: 'bg-red-100 text-red-600' },
                { value: 'LEADER', label: 'Líder', color: 'bg-yellow-100 text-yellow-700' },
                { value: 'EXECUTOR', label: 'Ejecutor', color: 'bg-blue-100 text-blue-600' }
              ].map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      role: role.value
                    })
                  }
                  className={`
        px-4 py-2 rounded-xl text-sm font-medium transition
        ${formData.role === role.value
                      ? role.color
                      : 'bg-gray-100 text-gray-500'}
      `}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium transition"
            >
              Crear usuario
            </button>
          </div>

        </form>
      </div>

      {message && (
        <div
          className={`
      fixed top-5 right-5 z-50
      px-4 py-3 rounded-xl
      shadow-lg
      text-sm font-medium
      ${message.includes('Error')
              ? 'bg-red-500 text-white'
              : 'bg-[#5B5CF0] text-white'
            }
    `}
        >
          {message}
        </div>
      )}

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

            <div className="mt-2">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                {filteredUsers.length} usuarios
              </span>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">

            <span className="text-sm text-gray-500">
              Filtrar:
            </span>

            <div className="flex flex-wrap gap-2">

              {[
                {
                  value: 'ALL',
                  label: 'Todos',
                  active: 'bg-[#5B5CF0] text-white'
                },
                {
                  value: 'ADMIN',
                  label: 'Admin',
                  active: 'bg-red-100 text-red-600'
                },
                {
                  value: 'LEADER',
                  label: 'Líder',
                  active: 'bg-yellow-100 text-yellow-700'
                },
                {
                  value: 'EXECUTOR',
                  label: 'Ejecutor',
                  active: 'bg-blue-100 text-blue-600'
                }
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setRoleFilter(role.value)}
                  className={`
        px-4 py-2 rounded-full text-sm font-medium transition
        ${roleFilter === role.value
                      ? role.active
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }
      `}
                >
                  {role.label}
                </button>
              ))}

            </div>

          </div>
        </div>

        {tableMessage && (
          <div
            className={`fixed top-20 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              tableMessage.includes('Error') ? 'bg-red-500 text-white' : 'bg-[#5B5CF0] text-white'
            }`}
          >
            {tableMessage}
          </div>
        )}

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

                  <th className="px-8 py-4 text-sm font-semibold text-gray-700 text-center">
                    Acciones
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredUsers.map(user => {

                  let roleClass = '';

                  if (user.role === 'ADMIN') {
                    roleClass = 'bg-red-100 text-red-600';
                  } else if (user.role === 'LEADER') {
                    roleClass = 'bg-yellow-100 text-yellow-700';
                  } else {
                    roleClass = 'bg-blue-100 text-blue-600';
                  }

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >

                      <td className="px-8 py-5">
                        {editingUser?.id === user.id ? (
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                name: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800">
                            {user.name || '-'}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-5 text-sm text-gray-500">
                        {user.email}
                      </td>

                      <td className="px-8 py-5">
                        {editingUser?.id === user.id ? (
                          <div className="flex flex-wrap gap-2">
                            {[
                              {
                                value: 'ADMIN',
                                label: 'Admin',
                                active: 'bg-red-100 text-red-600 border-red-200'
                              },
                              {
                                value: 'LEADER',
                                label: 'Líder',
                                active: 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              },
                              {
                                value: 'EXECUTOR',
                                label: 'Ejecutor',
                                active: 'bg-blue-100 text-blue-600 border-blue-200'
                              }
                            ].map((role) => (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() =>
                                  setEditFormData({
                                    ...editFormData,
                                    role: role.value
                                  })
                                }
                                className={`
          px-3 py-1.5 rounded-full text-xs font-medium border transition
          ${editFormData.role === role.value
                                    ? role.active
                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                  }
        `}
                              >
                                {role.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${roleClass}`}
                          >
                            {roleLabels[user.role]}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-5 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-3">

                          {editingUser?.id === user.id ? (
                            <>
                              <button
                                onClick={handleUpdate}
                                className="text-green-600 hover:text-green-700"
                                title="Guardar"
                              >
                                <Save size={18} />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  setEditFormData({
                                    name: '',
                                    role: ''
                                  });
                                }}
                                className="text-gray-500 hover:text-gray-700"
                                title="Cancelar"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(user)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>

                              <button
                                onClick={() => setDeleteUser(user)}
                                className="text-red-600 hover:text-red-700"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={!!deleteUser}
        title="Eliminar usuario"
        message={
          deleteUser
            ? `¿Deseas eliminar a ${deleteUser.name} (${deleteUser.email})?`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  )
}

export default UserManagement;
