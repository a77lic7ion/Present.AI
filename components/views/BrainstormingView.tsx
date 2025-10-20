import React, { useState } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { generateTopicsWithGemini } from '../../services/geminiService';
import type { Reference } from '../../types';
import { readFileAsText } from '../../utils/fileUtils';

import Logo from '../Logo';
import { SparklesIcon, FolderOpenIcon, PaperClipIcon, XCircleIcon, UploadCloudIcon, LinkIcon, SettingsIcon } from '../icons';
import Spinner from '../common/Spinner';
import LoadProjectModal from '../common/LoadProjectModal';
import SettingsModal from '../common/SettingsModal';

const BrainstormingView: React.FC = () => {
  const [presentationTitle, setPresentationTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadProjectOpen, setLoadProjectOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const { setTitle, setTopics, setCurrentView } = usePresentationStore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setError(null);
    try {
        const newReferences: Reference[] = await Promise.all(
            Array.from(files).map(async file => ({
                type: 'file',
                name: file.name,
                content: await readFileAsText(file),
            }))
        );
        setReferences(prev => [...prev, ...newReferences]);
    } catch (err) {
        console.error("Error reading files:", err);
        setError("There was an error reading one or more files. Please try again.");
    }
  };
  
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
        setError("Please enter a valid URL (starting with http:// or https://).");
        return;
    }
    setError(null);
    const newReference: Reference = {
        type: 'url',
        name: urlInput,
        content: urlInput // For URLs, content is the URL itself
    };
    setReferences(prev => [...prev, newReference]);
    setUrlInput('');
  };

  const removeReference = (refName: string) => {
    setReferences(refs => refs.filter(ref => ref.name !== refName));
  };
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !presentationTitle.trim()) {
        setError("Please provide both a presentation title and a topic description.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        const topics = await generateTopicsWithGemini(prompt, references);
        if (topics.length === 0) {
            setError("The AI didn't generate any topics. Try rephrasing your prompt.");
            setIsLoading(false);
            return;
        }
        setTitle(presentationTitle);
        setTopics(topics);
        setCurrentView('editor');
    } catch (err) {
        console.error("Failed to generate topics:", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Failed to generate presentation: ${message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-grid-pattern">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 rounded-lg bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] transition-colors"
                    title="Settings"
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setLoadProjectOpen(true)}
                    className="px-4 py-2 text-sm rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center gap-2"
                >
                    <FolderOpenIcon className="w-4 h-4" /> Load Project
                </button>
            </header>
            
            <div className="w-full max-w-2xl text-center">
                <Logo className="justify-center mb-4" />
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Brainstorm Your Next Presentation
                </h1>
                <p className="mt-4 text-lg text-gray-400">
                    Start with a topic, and let AI build the foundation for you. Provide a title,
                    describe your subject, and optionally add reference materials.
                </p>
            </div>

            <form onSubmit={handleGenerate} className="w-full max-w-2xl mt-10 space-y-6">
                <input
                    type="text"
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    placeholder="e.g., The Future of Renewable Energy"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
                    disabled={isLoading}
                />
                
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your presentation topic in detail..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 h-32 resize-none focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
                    disabled={isLoading}
                />

                <div className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg p-4 space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); }}}
                            placeholder="Add a URL for context..."
                            className="flex-grow bg-[#2a2a2a] border border-[var(--input-border)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--orange-primary)] focus:outline-none"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={handleAddUrl}
                            disabled={isLoading || !urlInput.trim()}
                            className="px-4 py-2 text-sm font-bold rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors disabled:opacity-50"
                        >
                            Add URL
                        </button>
                    </div>
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                        <UploadCloudIcon className="w-8 h-8 text-gray-500 mb-2"/>
                        <p className="text-sm text-gray-400"><span className="font-semibold text-[var(--orange-primary)]">Click to upload files</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">Attach reference documents (TXT, PDF, DOCX, etc.)</p>
                        <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileChange} disabled={isLoading} />
                    </label>
                    {references.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-400">Attached References:</h3>
                            {references.map(ref => (
                                <div key={ref.name} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded-md text-sm">
                                    <span className="flex items-center gap-2 text-gray-300 overflow-hidden">
                                        {ref.type === 'file' ? <PaperClipIcon className="w-4 h-4 flex-shrink-0" /> : <LinkIcon className="w-4 h-4 flex-shrink-0" />}
                                        <span className="truncate" title={ref.name}>{ref.name}</span>
                                    </span>
                                    <button type="button" onClick={() => removeReference(ref.name)} className="text-gray-500 hover:text-red-400" disabled={isLoading}>
                                        <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || !presentationTitle.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold rounded-lg bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Spinner /> : <SparklesIcon className="w-6 h-6" />}
                    {isLoading ? 'Generating...' : 'Generate Presentation'}
                </button>
                
                {error && <p className="text-center text-red-400">{error}</p>}
            </form>
        </div>
        <LoadProjectModal isOpen={isLoadProjectOpen} onClose={() => setLoadProjectOpen(false)} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default BrainstormingView;