export default function LoadingSpinner({ text = 'Đang tải...' }) {
  return (
    <div className="spinner-overlay">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        {text && (
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
