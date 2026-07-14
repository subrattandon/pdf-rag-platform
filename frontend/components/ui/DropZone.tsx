"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import Button from "./Button";

interface DropZoneProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export default function DropZone({ onUpload, accept = ".pdf", maxSize = 50 * 1024 * 1024 }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith(".pdf")) {
        setError("Only PDF files are allowed");
        return;
      }

      if (file.size > maxSize) {
        setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      setSelectedFile(file);
    },
    [maxSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (file) {
        validateAndSelect(file);
      }
    },
    [validateAndSelect]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSelect(file);
      }
    },
    [validateAndSelect]
  );

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
  };

  if (selectedFile) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--obsidian-elevated)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--violet-soft)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--violet-light)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--gallery-fg)' }}>
                {selectedFile.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--gallery-ghost)' }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-xl"
              style={{
                color: 'var(--gallery-ghost)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--gallery-fg)';
                e.currentTarget.style.background = 'rgba(129,140,248,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--gallery-ghost)';
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" onClick={handleClear} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpload} className="flex-1">
              Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'var(--obsidian-elevated)',
        border: isDragging ? '2px dashed rgba(129,140,248,0.4)' : '2px dashed rgba(255,255,255,0.06)',
        boxShadow: isDragging ? '0 0 24px rgba(99,102,241,0.08)' : 'none',
        transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <label className="block cursor-pointer p-6 text-center">
        <input type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
        <div className="flex flex-col items-center gap-2.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: isDragging ? 'rgba(129,140,248,0.15)' : 'var(--violet-soft)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 200ms ease',
            }}
          >
            <Upload
              className="w-5 h-5"
              style={{
                color: isDragging ? 'var(--violet-light)' : 'var(--gallery-ghost)',
                transition: 'color 200ms ease',
              }}
            />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--gallery-fg)' }}>
              {isDragging ? "Drop your PDF here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gallery-ghost)' }}>
              PDF up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      </label>
      {error && <p className="text-xs text-red-400 text-center pb-4">{error}</p>}
    </div>
  );
}
