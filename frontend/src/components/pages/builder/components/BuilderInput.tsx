import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDarkModeStore from '../../../../../store/darkmode.store';
import { useUserStore } from '../../../../../store/user.store';
import { useCreateAgent } from '../hooks';
import { FadeIn, ScaleIn } from '../../../shared/animation';
import { ManualAgentModal } from './modal';
import type { ManualAgentData } from './modal';

interface BuilderInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  templateId?: string;
}

function BuilderInput({ prompt, setPrompt, templateId }: BuilderInputProps) {
  const [mode, setMode] = useState<'yolo' | 'manual'>('yolo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDarkMode } = useDarkModeStore();
  const { isAuthenticated } = useUserStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { handleCreate, createAgent, isCreating } = useCreateAgent();

  useEffect(() => {
    // Focus on the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 150);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  const handleCreateClick = () => {
    if (!prompt.trim()) return;
    
    // בדיקה אם המשתמש מאומת
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }
    
    if (mode === 'manual') {
      setIsModalOpen(true);
    } else {
      handleCreate({ 
        prompt,
        ...(templateId && { template_id: templateId })
      });
    }
  };

  const handleManualSubmit = (data: ManualAgentData) => {
    // בדיקה אם המשתמש מאומת
    if (!isAuthenticated) {
      navigate('/auth/signin');
      setIsModalOpen(false);
      return;
    }
    
    createAgent({
      prompt: data.prompt,
    });
    setIsModalOpen(false);
    setPrompt('');
  };

  return (
    <FadeIn delay={0.4} duration={0.8} y={30} className="w-full max-w-4xl mx-auto mb-16">
      <div className={`relative p-[1.5px] rounded-2xl shadow-2xl ${
        isDarkMode
          ? 'bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30'
          : 'bg-gradient-to-r from-purple-400/40 via-pink-400/40 to-purple-400/40'
      }`}
        style={{
          boxShadow: isDarkMode 
            ? '0 20px 60px rgba(168, 85, 247, 0.3), 0 0 100px rgba(168, 85, 247, 0.15)' 
            : '0 20px 60px rgba(168, 85, 247, 0.25), 0 0 80px rgba(168, 85, 247, 0.1)'
        }}
      >
        <div className={`rounded-2xl px-6 py-6 backdrop-blur-xl ${
          isDarkMode
            ? 'bg-gradient-to-b from-gray-800/90 to-gray-900/90'
            : 'bg-gradient-to-b from-white/95 to-purple-50/95'
        }`}>
          <FadeIn delay={0.6} duration={0.6}>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build an agent that can manage project tasks"
              rows={1}
              className={`w-full bg-transparent text-base outline-none pb-5 mb-5 resize-none overflow-y-auto custom-scrollbar
                ${isDarkMode
                  ? 'text-gray-300 placeholder-gray-500 border-b border-gray-700/50'
                  : 'text-gray-800 placeholder-gray-400 border-b border-purple-200'
                }
              `}
              style={{ 
                minHeight: '32px', 
                maxHeight: '150px'
              }}
            />
          </FadeIn>
          
          <FadeIn delay={0.8} duration={0.6} y={10}>
            <div className="flex items-center justify-between">
              <div className={`flex gap-1 p-0.5 rounded-full backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-800/60 border border-gray-700/50' 
                  : 'bg-white/60 border border-purple-200/50'
              }`}>
                <div className="relative group">
                  <ScaleIn delay={1} duration={0.4} scale={0.8}>
                    <button
                      onClick={() => setMode('yolo')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
                        mode === 'yolo'
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/50 scale-105'
                          : isDarkMode
                            ? 'bg-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                            : 'bg-transparent text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <span className="text-xs">⚡</span>
                      <span className="text-xs font-semibold">YOLO</span>
                    </button>
                  </ScaleIn>
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50" style={{ top: 'calc(100% + 8px)' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[6px] border-transparent border-b-purple-500/40"></div>
                  <div className="relative px-4 py-3 rounded-xl border border-purple-400/40 bg-gray-900/95 backdrop-blur-xl text-xs text-gray-100 shadow-[0_10px_30px_rgba(168,85,247,0.3)] whitespace-nowrap">
                    <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 blur opacity-60"></div>
                    <div className="relative flex items-center gap-2">
                      <span className="text-purple-300">⚡</span>
                      <span>Create your agent with a single click</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <ScaleIn delay={1.1} duration={0.4} scale={0.8}>
                  <button
                    onClick={() => setMode('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
                      mode === 'manual'
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/50 scale-105'
                        : isDarkMode
                          ? 'bg-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                          : 'bg-transparent text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span className="text-xs">⚙️</span>
                    <span className="text-xs font-semibold">Manual</span>
                  </button>
                </ScaleIn>
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50" style={{ top: 'calc(100% + 8px)' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[6px] border-transparent border-b-indigo-500/40"></div>
                  <div className="relative px-4 py-3 rounded-xl border border-indigo-400/40 bg-gray-900/95 backdrop-blur-xl text-xs text-gray-100 shadow-[0_10px_30px_rgba(99,102,241,0.3)] whitespace-nowrap">
                    <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-indigo-500/30 blur opacity-60"></div>
                    <div className="relative flex items-center gap-2">
                      <span className="text-indigo-300">⚙️</span>
                      <span>Step by step agent creation flow</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <ScaleIn delay={1.2} duration={0.5} scale={0.8} springy>
              <button
                onClick={handleCreateClick}
                disabled={isCreating || !prompt.trim()}
                className="relative overflow-visible group flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 hover:from-purple-500 hover:via-purple-400 hover:to-orange-400 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {/* Spark Animation - Main Beam */}
              <span 
                className="absolute left-0 inset-y-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none group-hover:animate-spark-slide"
                style={{ width: '60px', opacity: 0 }}
              />
              
              {/* Sparkles - More visible */}
              <span 
                className="absolute -right-1 top-0 text-yellow-300 text-lg pointer-events-none"
                style={{ opacity: 0, textShadow: '0 0 10px rgba(253, 224, 71, 0.8)' }}
              >
                <span className="group-hover:animate-sparkle-1">✦</span>
              </span>
              <span 
                className="absolute -right-2 top-1/2 -translate-y-1/2 text-white text-base pointer-events-none"
                style={{ opacity: 0, textShadow: '0 0 10px rgba(255, 255, 255, 0.8)' }}
              >
                <span className="group-hover:animate-sparkle-2">✨</span>
              </span>
              <span 
                className="absolute -right-1 bottom-0 text-orange-300 text-sm pointer-events-none"
                style={{ opacity: 0, textShadow: '0 0 10px rgba(251, 146, 60, 0.8)' }}
              >
                <span className="group-hover:animate-sparkle-3">⭐</span>
              </span>
              
              <span className="relative z-10 flex items-center gap-1.5">
                {isCreating ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span className="text-sm">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">→</span>
                    <span className="text-sm">Create</span>
                  </>
                )}
              </span>
              </button>
            </ScaleIn>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Manual Agent Modal */}
      <ManualAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleManualSubmit}
        initialPrompt={prompt}
      />
    </FadeIn>
  );
}

export default BuilderInput;

