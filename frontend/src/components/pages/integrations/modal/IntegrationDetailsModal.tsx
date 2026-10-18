import useDarkModeStore from '../../../../../store/darkmode.store';
import useModalsStore from '../../../../../store/modals.store';
import { X, Zap } from 'lucide-react';
import { useGetToolCapabilities } from '../hooks';

function IntegrationDetailsModal() {
  const { isDarkMode } = useDarkModeStore();
  const { integrationDetailsModal, closeIntegrationDetailsModal } = useModalsStore();

  // שליפת ה-capabilities של הכלי
  const { capabilities, isLoading, isError } = useGetToolCapabilities(
    integrationDetailsModal.integrationSlug // שולח את שם הכלי כ-query parameter
  );

  if (!integrationDetailsModal.isOpen) return null;

  const handleClose = () => {
    closeIntegrationDetailsModal();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl border-2 max-h-[85vh] overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700/50' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header - Fixed */}
          <div className="p-8 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-3xl">📧</span>
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {integrationDetailsModal.integrationName} Capabilities
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {capabilities?.count || 0} Available Actions
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 modal-scrollbar">
            {isLoading && (
              <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-lg">Loading capabilities...</p>
              </div>
            )}

            {isError && (
              <div className={`text-center py-12 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                <p className="text-lg">❌ Error loading data</p>
              </div>
            )}

            {!isLoading && !isError && capabilities && (
              <div className="space-y-3">
                {capabilities.slugs && capabilities.slugs.length > 0 ? (
                  capabilities.slugs.map((slug, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30 hover:border-purple-500/50'
                          : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500'
                        }`}>
                          <Zap className={`w-4 h-4 ${
                            isDarkMode ? 'text-purple-400' : 'text-white'
                          }`} />
                        </div>
                        <code className={`flex-1 text-sm font-mono ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          {slug}
                        </code>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-12 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No capabilities available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className={`p-6 border-t ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={isDarkMode ? 'text-purple-400' : 'text-purple-600'}>Tool:</span> {capabilities?.tool_name || integrationDetailsModal.integrationSlug} | <span className={isDarkMode ? 'text-purple-400' : 'text-purple-600'}>{capabilities?.count || 0}</span> available actions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntegrationDetailsModal;

