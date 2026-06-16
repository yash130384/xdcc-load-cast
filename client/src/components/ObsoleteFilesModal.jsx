import { TrashIcon, CloseIcon } from './icons.jsx';

export default function ObsoleteFilesModal({
  showObsoleteModal, selectedObsoleteFiles, onClose, onToggleFile, onDeleteSelected, isSelected
}) {
  if (!showObsoleteModal) return null;

  const allSelected = selectedObsoleteFiles.length === showObsoleteModal.length;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '550px' }}>
        <div className="modal-header">
          <span className="modal-title"><TrashIcon /> Veraltete Dateien bereinigen</span>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Die folgenden Dateien in deiner Mediathek sind veraltet. Markierte Dateien werden unwiderruflich von der Festplatte gelöscht.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: '600',
            fontSize: '0.85rem',
            color: 'var(--text-primary)'
          }}>
            <input
              type="checkbox"
              id="select-all-obsolete"
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              checked={allSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  showObsoleteModal.forEach(f => {
                    if (!isSelected(f.filename)) onToggleFile(f.filename);
                  });
                } else {
                  selectedObsoleteFiles.forEach(f => onToggleFile(f));
                }
              }}
            />
            <label htmlFor="select-all-obsolete" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Alle auswählen ({showObsoleteModal.length})
            </label>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '250px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
            padding: '0.5rem',
            border: '1px solid var(--border-color)'
          }}>
            {showObsoleteModal.map((file, idx) => {
              const checked = isSelected(file.filename);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    background: checked ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    id={`obsolete-file-${idx}`}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    checked={checked}
                    onChange={() => onToggleFile(file.filename)}
                  />
                  <label
                    htmlFor={`obsolete-file-${idx}`}
                    style={{
                      fontSize: '0.82rem',
                      color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexGrow: 1,
                      userSelect: 'none'
                    }}
                    title={file.filename}
                  >
                    {file.filename}
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {file.sizeBytes ? formatBytes(file.sizeBytes) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="settings-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="btn btn-danger"
            style={{
              background: 'rgba(255, 51, 102, 0.2)',
              color: 'var(--accent-red)',
              borderColor: 'rgba(255, 51, 102, 0.3)'
            }}
            disabled={selectedObsoleteFiles.length === 0}
            onClick={onDeleteSelected}
          >
            Ausgewählte löschen ({selectedObsoleteFiles.length})
          </button>
        </div>
      </div>
    </div>
  );
}