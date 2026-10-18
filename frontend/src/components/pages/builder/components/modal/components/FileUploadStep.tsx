import { type RefObject } from 'react';
import { Upload, Download, FileText, Trash2 } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

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

function FileUploadStep({
  files,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemoveFile,
  formatFileSize
}: FileUploadStepProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h3 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          Upload Knowledge Base Files
        </h3>
        <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Add files to give your agent access to specific knowledge. This step is optional.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? isDarkMode
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-purple-500 bg-purple-50'
            : isDarkMode
              ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.xls,.xlsx,.doc,.docx"
          onChange={onFileSelect}
          className="hidden"
        />
        
        <Upload className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 ${
          isDragging
            ? 'text-purple-500'
            : isDarkMode
              ? 'text-gray-500'
              : 'text-gray-400'
        }`} />
        
        <h4 className={`text-sm sm:text-base font-semibold mb-1 sm:mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Drag & drop files here
        </h4>
        
        <p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          or click to browse files
        </p>
        
        <p className={`text-xs ${
          isDarkMode ? 'text-gray-600' : 'text-gray-500'
        }`}>
          Supported formats: PDF, TXT, MD, CSV, XLS, XLSX
        </p>
        <p className={`text-xs ${
          isDarkMode ? 'text-gray-600' : 'text-gray-500'
        }`}>
          Max: 10MB • 10 files
        </p>
      </div>

      {/* How it works */}
      <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
        isDarkMode
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-blue-50 border-blue-300'
      }`}>
        <div className="flex items-start gap-2 sm:gap-3">
          <Download className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <div>
            <h5 className={`text-xs sm:text-sm font-semibold mb-1 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              How it works
            </h5>
            <p className={`text-xs ${
              isDarkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              Your agent will be able to search through these files and answer questions based on their content. The files are processed and indexed when you create the agent.
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h5 className={`text-xs sm:text-sm font-semibold ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Uploaded Files ({files.length}/10)
          </h5>
          <div className="space-y-2 max-h-[150px] sm:max-h-[200px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <FileText className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium truncate ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploadStep;

