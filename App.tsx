
import React from 'react';
import { usePresentationStore } from './store/presentationStore';
import BrainstormingView from './components/views/BrainstormingView';
import EditorView from './components/views/EditorView';
import ScriptGeneratorView from './components/views/ScriptGeneratorView';

const App: React.FC = () => {
  const currentView = usePresentationStore((state) => state.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'brainstorming':
        return <BrainstormingView />;
      case 'editor':
        return <EditorView />;
      case 'script':
        return <ScriptGeneratorView />;
      default:
        return <BrainstormingView />;
    }
  };

  return (
    <div className="bg-[var(--dark-void)] text-[var(--text-color)] min-h-screen font-sans flex flex-col">
      <main className="flex-grow">
        {renderView()}
      </main>
      <footer className="text-center py-4 text-xs text-gray-500 border-t border-solid border-t-[#333]">
        Created by AfflictedAI 2025
      </footer>
    </div>
  );
};

export default App;
