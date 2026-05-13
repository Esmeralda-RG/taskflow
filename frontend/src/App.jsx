import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8 text-blue-400">
          TaskFlow
        </h1>
        <p className="text-xl mb-8 text-gray-400">
          Sistema de Gestión de Proyectos
        </p>
        
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
          <button
            onClick={() => setCount(count + 1)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-medium transition-colors"
          >
            Haz clic aquí → {count}
          </button>
          <p className="mt-6 text-gray-500">Frontend listo con Tailwind v4</p>
        </div>
      </div>
    </div>
  )
}

export default App
