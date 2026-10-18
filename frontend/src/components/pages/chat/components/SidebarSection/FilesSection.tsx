import { useRef } from 'react';
import useDarkModeStore from '../../../../../../store/darkmode.store';
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
  const { isDarkMode } = useDarkModeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4 pt-4 space-y-4">
      {/* Description */}
      <div className={`p-3 border rounded-xl ${
        isDarkMode
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-green-500/20 border-green-500/30'
      }`}>
        <p className={`text-sm ${
          isDarkMode ? 'text-green-200' : 'text-green-700'
        }`}>
          Upload files to enrich your agent's knowledge base.
        </p>
      </div>

      {/* Upload Files Section */}
      <div className={`p-4 rounded-xl border ${
        isDarkMode
          ? 'bg-white/[0.03] border-white/[0.05]'
          : 'bg-white border-purple-200'
      }`}>
        <h4 className={`text-base font-semibold mb-3 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Upload Files
        </h4>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onFileSelect?.(files);
          }}
        />
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-xs font-medium transition-all duration-200"
            type="button"
          >
            Select Files
          </button>
          <span className={`px-4 py-2 rounded-lg text-xs flex items-center ${
            isDarkMode
              ? 'bg-white/[0.05] text-gray-400'
              : 'bg-purple-50 text-gray-600'
          }`}>
            {selectedFiles.length > 0 
              ? `${selectedFiles.length} ${selectedFiles.length === 1 ? 'file selected' : 'files selected'}`
              : 'No file selected'}
          </span>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className={`p-2 rounded-lg flex items-center justify-between ${
                isDarkMode ? 'bg-white/[0.05]' : 'bg-purple-50'
              }`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg className={`w-4 h-4 flex-shrink-0 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className={`text-xs truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{file.name}</span>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}>({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <button
                  onClick={() => {
                    const newFiles = selectedFiles.filter((_, i) => i !== index);
                    onFileSelect?.(newFiles);
                  }}
                  className="text-red-400 hover:text-red-300 text-xs ml-2"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={onUploadFiles}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>מעלה...</span>
            </>
          ) : (
            <span>Upload File</span>
          )}
        </button>
      </div>

      {/* Uploaded Files Table */}
      {uploadedFiles.length > 0 ? (
        <div className={`overflow-x-auto table-scrollbar ${isDarkMode ? 'dark' : ''}`}>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'border-white/[0.1]' : 'border-purple-200'
              }`}>
                <th className={`text-left py-2 px-3 text-xs font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>FILENAME</th>
                <th className={`text-left py-2 px-3 text-xs font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>STATUS</th>
                <th className={`text-left py-2 px-3 text-xs font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>UPLOADED AT</th>
                <th className={`text-left py-2 px-3 text-xs font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map((file) => {
                const fileId = file.id;
                return (
                <tr key={fileId} className={`border-b ${
                  isDarkMode ? 'border-white/[0.05]' : 'border-purple-100'
                }`}>
                  <td className={`py-3 px-3 text-xs truncate max-w-[150px] ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`} title={file.original_filename}>
                    {file.original_filename}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Active
                    </span>
                  </td>
                  <td className={`py-3 px-3 text-xs whitespace-nowrap ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {new Date(file.uploaded_at).toLocaleDateString('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDownloadFile?.(file.id, file.original_filename)}
                        className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download file"
                        type="button"
                        disabled={isDownloading}
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteFile?.(file.id, file.original_filename)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        type="button"
                        title="Delete file"
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isDarkMode ? 'bg-white/[0.05]' : 'bg-purple-50'
          }`}>
            <svg className={`w-8 h-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>No files uploaded yet.</p>
        </div>
      )}
    </div>
  );
};

