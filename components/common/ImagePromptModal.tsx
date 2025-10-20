
import React, { useState, useEffect } from 'react';

interface ImagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  initialPrompt?: string;
  isLoading: boolean;
}

const ImagePromptModal: React.FC<ImagePromptModalProps> = ({ isOpen, onClose, onSubmit, initialPrompt = '', isLoading }) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[var(--dark-void)] border border-[#333] rounded-lg shadow-xl p-8 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Generate Image</h2>
        <p className="text-gray-400 mb-6">Describe the image you want to create for this slide.</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none h-32 resize-none"
            placeholder="e.g., A minimalist illustration of a neural network"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2 rounded-lg bg-[var(--orange-primary)] text-black font-bold hover:bg-[var(--orange-secondary)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full border-t-2 border-r-2 border-white h-4 w-4"></div>
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImagePromptModal;
