import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { testEndpoint as testOllamaEndpoint } from '../../services/ollamaService';
import { testGeminiConnection } from '../../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    geminiApiKey, setGeminiApiKey,
    ollamaEndpoint, setOllamaEndpoint,
    openAiApiKey, setOpenAiApiKey,
    mistralApiKey, setMistralApiKey
  } = useSettingsStore();

  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
  const [localOllamaEndpoint, setLocalOllamaEndpoint] = useState(ollamaEndpoint);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [localOpenAiKey, setLocalOpenAiKey] = useState(openAiApiKey);
  const [localMistralKey, setLocalMistralKey] = useState(mistralApiKey);
  
  useEffect(() => {
      setLocalGeminiKey(geminiApiKey);
      setLocalOllamaEndpoint(ollamaEndpoint);
      setLocalOpenAiKey(openAiApiKey);
      setLocalMistralKey(mistralApiKey);
      setGeminiStatus('idle');
      setOllamaStatus('idle');
  }, [isOpen, geminiApiKey, ollamaEndpoint, openAiApiKey, mistralApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(localGeminiKey);
    setOllamaEndpoint(localOllamaEndpoint);
    setOpenAiApiKey(localOpenAiKey);
    setMistralApiKey(localMistralKey);
    onClose();
  };
  
  const handleTestOllama = async () => {
      setOllamaStatus('testing');
      const isOk = await testOllamaEndpoint(localOllamaEndpoint);
      setOllamaStatus(isOk ? 'ok' : 'error');
  };

  const handleTestGemini = async () => {
    setGeminiStatus('testing');
    const isOk = await testGeminiConnection(localGeminiKey);
    setGeminiStatus(isOk ? 'ok' : 'error');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[var(--dark-void)] border border-[#333] rounded-lg shadow-xl p-8 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold mb-6 text-white">Connectors</h2>
        <div className="space-y-6">
          
          <div>
            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-2">Google Gemini API Key</label>
             <div className="flex gap-2">
               <input
                id="gemini-key"
                type="password"
                value={localGeminiKey}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                className="flex-grow bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
                placeholder="Enter your Gemini API Key"
              />
              <button type="button" onClick={handleTestGemini} disabled={!localGeminiKey || geminiStatus === 'testing'} className="px-4 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {geminiStatus === 'testing' ? 'Testing...' : 'Test'}
              </button>
            </div>
             {geminiStatus === 'testing' && <p className="text-gray-400 text-xs mt-1">Testing connection...</p>}
             {geminiStatus === 'ok' && <p className="text-green-400 text-xs mt-1">Connection successful!</p>}
             {geminiStatus === 'error' && <p className="text-red-400 text-xs mt-1">Connection failed. Check API key.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ollama Endpoint</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localOllamaEndpoint}
                onChange={(e) => setLocalOllamaEndpoint(e.target.value)}
                className="flex-grow bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
              />
              <button onClick={handleTestOllama} disabled={!localOllamaEndpoint || ollamaStatus === 'testing'} className="px-4 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {ollamaStatus === 'testing' ? 'Testing...' : 'Test'}
              </button>
            </div>
            {ollamaStatus === 'ok' && <p className="text-green-400 text-xs mt-1">Connection successful!</p>}
            {ollamaStatus === 'error' && <p className="text-red-400 text-xs mt-1">Connection failed.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">OpenAI API Key (Mock)</label>
            <input
              type="password"
              value={localOpenAiKey}
              onChange={(e) => setLocalOpenAiKey(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mistral API Key (Mock)</label>
            <input
              type="password"
              value={localMistralKey}
              onChange={(e) => setLocalMistralKey(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-[var(--orange-primary)] text-black font-bold hover:bg-[var(--orange-secondary)] transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
