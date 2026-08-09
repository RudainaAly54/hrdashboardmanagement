import { FiAlertTriangle } from "react-icons/fi";

const ConfirmDialog = ({ isOpen, title, message, confirmLabel = "Delete", onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FiAlertTriangle className="text-red-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold">{title}</h3>
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? "Deleting..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;