import { X, AlertTriangle } from 'lucide-react';

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">

        <div className="flex items-start justify-between mb-5">

          <div className="flex items-center gap-3">

            <div
              className={`
                w-10 h-10 rounded-full
                flex items-center justify-center
                ${danger
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'}
              `}
            >
              <AlertTriangle size={18} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {title}
              </h3>
            </div>

          </div>

          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

        </div>

        <p className="text-sm text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-3">

          <button
            onClick={onCancel}
            className="
              px-4 py-2
              rounded-xl
              bg-gray-100
              hover:bg-gray-200
              text-gray-700
              text-sm
            "
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`
              px-4 py-2
              rounded-xl
              text-white
              text-sm
              transition
              ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#5B5CF0] hover:bg-[#4c4de0]'
              }
            `}
          >
            {confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}

export default ConfirmModal;