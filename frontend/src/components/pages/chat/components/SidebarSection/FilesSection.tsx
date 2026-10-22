import { useRef } from 'react';
import { Download, FilePlus2, FileText, Trash2, X } from 'lucide-react';

import { Button, IconButton } from '@/components/ui/button';
import type { AgentFile } from '../../types';

interface FilesSectionProps {
  selectedFiles?: File[];
  onFileSelect?: (files: File[]) => void;
  onUploadFiles?: () => void;
  isUploading?: boolean;
  uploadedFiles?: AgentFile[];
  onDeleteFile?: (fileId: string | number, fileName: string) => void;
  onDownloadFile?: (fileId: string | number, fileName: string) => void;
  isDownloading?: boolean;
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

export const FilesSection = ({
  selectedFiles = [],
  onFileSelect,
  onUploadFiles,
  isUploading = false,
  uploadedFiles = [],
  onDeleteFile,
  onDownloadFile,
  isDownloading = false
}: FilesSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 text-sm text-white/72">The agent reads these files before it answers.</p>

      {/* Upload */}
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-white/20 p-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onFileSelect?.(files);
          }}
        />
        <div className="flex items-center gap-3">
          <Button variant="glass" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FilePlus2 />
            Choose files
          </Button>
          <span className="text-[13px] text-white/60">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'} ready`
              : 'Nothing chosen yet'}
          </span>
        </div>

        {selectedFiles.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl bg-white/5 py-1 pr-1 pl-3 text-[13px]">
                <FileText className="size-3.5 shrink-0 text-white/60" strokeWidth={1.7} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="text-xs text-white/55">{formatSize(file.size)}</span>
                <IconButton
                  size="sm"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    const newFiles = selectedFiles.filter((_, i) => i !== index);
                    onFileSelect?.(newFiles);
                  }}
                >
                  <X />
                </IconButton>
              </li>
            ))}
          </ul>
        )}

        <Button block size="sm" onClick={onUploadFiles} disabled={selectedFiles.length === 0} loading={isUploading}>
          {isUploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      {/* Uploaded */}
      <div className="flex flex-col gap-2.5">
        <h4 className="m-0 text-xs tracking-[0.08em] text-white/66 uppercase">Uploaded</h4>
        {uploadedFiles.length === 0 ? (
          <p className="m-0 rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-white/60">No files yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] py-2 pr-1.5 pl-3">
                <FileText className="size-4 shrink-0 text-white/70" strokeWidth={1.7} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm" title={file.original_filename}>
                    {file.original_filename}
                  </p>
                  <p className="m-0 text-xs text-white/55">
                    {formatSize(file.file_size)} ·{' '}
                    {new Date(file.uploaded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <IconButton size="sm" aria-label={`Download ${file.original_filename}`} onClick={() => onDownloadFile?.(file.id, file.original_filename)} disabled={isDownloading}>
                  <Download />
                </IconButton>
                <IconButton size="sm" aria-label={`Delete ${file.original_filename}`} onClick={() => onDeleteFile?.(file.id, file.original_filename)} className="hover:text-off">
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
