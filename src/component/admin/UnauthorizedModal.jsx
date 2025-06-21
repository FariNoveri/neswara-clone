import { AlertTriangle, LogOut } from 'lucide-react';

const UnauthorizedModal = ({ show, onClose, userEmail }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Akses Ditolak</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Maaf, Anda tidak memiliki akses ke halaman admin.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Email Anda: <span className="font-medium">{userEmail}</span>
          </p>
          <p className="text-sm text-gray-500">
            Hanya admin yang terdaftar yang dapat mengakses halaman ini.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
          >
            <LogOut className="h-4 w-4 mr-2 inline" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedModal;
