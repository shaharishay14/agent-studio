import { type RefObject } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/button';

interface FileUploadStepProps {
  files: File[];
  isDragging: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  formatFileSize: (bytes: number) => string;
}

function FileUploadStep({ files, isDragging, fileInputRef, onDragOver, onDragLeave, onDrop, onFileSelect, onRemoveFile, formatFileSize }: FileUploadStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-white/72">
        Optional. Add documents the agent can search and quote when it answers. They're processed when you create the agent.
      </p>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-3 rounded-inner border border-dashed px-6 py-8 text-center transition-colors duration-150',
          isDragging ? 'border-white bg-white/10' : 'border-white/30 bg-white/[0.03]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.xls,.xlsx,.doc,.docx"
          onChange={onFileSelect}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <Upload className="size-7 text-white/70" strokeWidth={1.7} aria-hidden="true" />
        <p className="m-0 text-[15px] font-medium text-white">Drop files here</p>
        <Button variant="glass" size="sm" onClick={() => fileInputRef.current?.click()}>
          Choose files
        </Button>
        <p className="m-0 text-xs text-white/55">PDF, Word, Excel, CSV, TXT or Markdown · up to 10 MB each · 10 files</p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="m-0 text-[13px] font-medium text-white/85">
            Added ({files.length}/10)
          </h4>
          <ul className="m-0 flex max-h-[200px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] py-2 pr-2 pl-3">
                <FileText className="size-4 shrink-0 text-white/70" strokeWidth={1.7} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{file.name}</span>
                  <span className="text-xs text-white/55">{formatFileSize(file.size)}</span>
                </span>
                <IconButton size="sm" aria-label={`Remove ${file.name}`} onClick={() => onRemoveFile(index)} className="hover:text-off">
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FileUploadStep;
