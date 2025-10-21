import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
  isSaving: boolean;
}

const SaveProjectModal: React.FC<SaveProjectModalProps> = ({ isOpen, onClose, onSave, initialName = '', isSaving }) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[var(--dark-void)] border border-[#333] rounded-lg shadow-xl p-8 w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Save Project</h2>
        <p className="text-gray-400 mb-6">Enter a name for your project file. This will be used when you load the project later.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
            placeholder="e.g., Q3 Marketing Strategy"
            disabled={isSaving}
            autoFocus
          />
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-6 py-2 rounded-lg bg-[var(--orange-primary)] text-black font-bold hover:bg-[var(--orange-secondary)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveProjectModal;
