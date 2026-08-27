import React, { useState, useEffect } from "react";
import { CloseIcon, DownloadIcon } from "./icons.jsx";

export default function SeasonDownloadModal({
  isOpen,
  onClose,
  seriesTitle,
  seasonName,
  episodes = [],
  onStartDownload
}) {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // Whenever modal opens or episodes change, pre-select all episodes
  useEffect(() => {
    if (isOpen && episodes.length > 0) {
      const allKeys = new Set(episodes.map((ep, idx) => ep.xtreamStreamId || ep.filename || idx));
      setSelectedKeys(allKeys);
    }
  }, [isOpen, episodes]);

  if (!isOpen) return null;

  const getEpisodeKey = (ep, idx) => ep.xtreamStreamId || ep.filename || idx;

  const handleToggle = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allKeys = new Set(episodes.map((ep, idx) => getEpisodeKey(ep, idx)));
    setSelectedKeys(allKeys);
  };

  const handleDeselectAll = () => {
    setSelectedKeys(new Set());
  };

  const handleDownload = () => {
    const selectedEpisodes = episodes.filter((ep, idx) => selectedKeys.has(getEpisodeKey(ep, idx)));
    if (selectedEpisodes.length > 0) {
      onStartDownload(selectedEpisodes);
      onClose();
    }
  };

  const selectedCount = selectedKeys.size;
  const totalCount = episodes.length;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ width: "650px", maxWidth: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <div>
            <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              📥 Staffel herunterladen
            </span>
            <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              {seriesTitle} — <strong style={{ color: "var(--accent-pink)" }}>{seasonName}</strong>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Schließen">
            <CloseIcon />
          </button>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 0",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Ausgewählt: <strong style={{ color: "var(--text-primary)" }}>{selectedCount}</strong> von <strong>{totalCount}</strong> Folgen
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSelectAll}
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
            >
              ✓ Alle auswählen
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDeselectAll}
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
            >
              ✗ Keine auswählen
            </button>
          </div>
        </div>

        <div style={{
          flex: "1 1 auto",
          overflowY: "auto",
          maxHeight: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          paddingRight: "0.3rem",
          marginBottom: "1rem"
        }}>
          {episodes.map((ep, idx) => {
            const key = getEpisodeKey(ep, idx);
            const isSelected = selectedKeys.has(key);
            const seasonEp = ep.metadata?.seasonEpisode || `Folge ${ep.episodeNum || idx + 1}`;
            const title = ep.metadata?.title || ep.filename;

            return (
              <div
                key={key}
                onClick={() => handleToggle(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.8rem",
                  background: isSelected ? "rgba(255, 0, 127, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${isSelected ? "rgba(255, 0, 127, 0.3)" : "var(--border-color)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s"
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--accent-pink)",
                    cursor: "pointer"
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "var(--accent-pink)",
                    background: "rgba(255, 0, 127, 0.12)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    flexShrink: 0
                  }}
                >
                  {seasonEp}
                </span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    fontWeight: isSelected ? "500" : "400",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  title={title}
                >
                  {title}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          borderTop: "1px solid var(--border-color)",
          paddingTop: "1rem",
          marginTop: "auto"
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: "0.5rem 1rem" }}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selectedCount === 0}
            onClick={handleDownload}
            style={{
              padding: "0.5rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: selectedCount > 0 ? "var(--grad-pink-purple, var(--accent-pink))" : undefined
            }}
          >
            <DownloadIcon />
            {selectedCount > 0 ? `Download starten (${selectedCount} ${selectedCount === 1 ? "Folge" : "Folgen"})` : "Keine Folgen ausgewählt"}
          </button>
        </div>
      </div>
    </div>
  );
}
