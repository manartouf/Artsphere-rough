const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1e1e38] border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-3">Are you sure?</h3>
        <p className="text-gray-400 mb-8">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 py-3 rounded-lg font-bold text-white hover:bg-red-700 transition"
          >
            Yes, confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 py-3 rounded-lg font-bold text-white hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;