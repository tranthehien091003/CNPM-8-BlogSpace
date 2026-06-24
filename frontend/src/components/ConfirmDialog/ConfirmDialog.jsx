import { useEffect } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './ConfirmDialog.css';

/**
 * ConfirmDialog — Modal xác nhận thao tác nguy hiểm.
 *
 * Props:
 * - isOpen    : boolean — hiển thị hay ẩn dialog
 * - title     : string  — tiêu đề (mặc định: "Xác nhận")
 * - message   : string  — nội dung câu hỏi
 * - confirmText: string — nhãn nút xác nhận (mặc định: "Xác nhận")
 * - cancelText : string — nhãn nút huỷ (mặc định: "Huỷ bỏ")
 * - onConfirm : fn()   — gọi khi bấm nút xác nhận
 * - onCancel  : fn()   — gọi khi bấm nút huỷ hoặc bấm ra ngoài
 * - danger    : boolean — nếu true, nút Confirm màu đỏ (dùng cho xoá)
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Xác nhận',
  message = 'Bạn có chắc muốn thực hiện thao tác này không?',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ bỏ',
  onConfirm,
  onCancel,
  danger = false,
}) {
  // Khoá cuộn trang khi dialog đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Đóng dialog khi bấm phím Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog glass-card animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Icon cảnh báo */}
        <div className={`confirm-icon ${danger ? 'confirm-icon--danger' : 'confirm-icon--info'}`}>
          <FiAlertTriangle size={28} />
        </div>

        {/* Nội dung */}
        <div className="confirm-content">
          <h3 id="confirm-title" className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
        </div>

        {/* Nút hành động */}
        <div className="confirm-actions">
          <button
            className="btn btn-secondary confirm-btn-cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            className={`btn confirm-btn-ok ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>

        {/* Nút đóng góc trên phải */}
        <button className="confirm-close" onClick={onCancel} title="Đóng">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}
