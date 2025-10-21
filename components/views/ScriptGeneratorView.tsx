
import React, { useState, useEffect } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { generateSpeakerNotesWithGemini } from '../../services/geminiService';
import { Slide } from '../../types';
import { EditIcon, MicIcon, SettingsIcon, HomeIcon } from '../icons';
import Spinner from '../common/Spinner';
import SettingsModal from '../common/SettingsModal';

const ScriptGeneratorView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
    const [isSettingsOpen, setSettingsOpen] = useState(false);

    const { title, topics, setSpeakerNotes, setCurrentView, resetProject } = usePresentationStore();
    
    const allSlides = topics.flatMap(t => t.subtopics);

    const selectedSlide = allSlides.find(s => s.id === selectedSlideId);

    useEffect(() => {
        if (allSlides.length > 0 && !selectedSlideId) {
            setSelectedSlideId(allSlides[0].id);
        }
    }, [allSlides, selectedSlideId]);

    const handleGenerateNotes = async (slide: Slide) => {
        setIsLoading(true);
        try {
            const notes = await generateSpeakerNotesWithGemini(slide, title);
            setSpeakerNotes(slide.id, notes);
        } catch (error) {
            console.error("Failed to generate speaker notes:", error);
            alert("Failed to generate speaker notes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (selectedSlide) {
            setSpeakerNotes(selectedSlide.id, e.target.value);
        }
    };

    const handleNewProject = () => {
        if (window.confirm("Are you sure you want to start a new project? Any unsaved changes will be lost.")) {
            resetProject();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[var(--dark-void)] text-[var(--text-color)]">
            <header className="w-full flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#333] p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleNewProject}
                        className="p-2 rounded-lg bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors"
                        title="Home / New Project"
                    >
                        <HomeIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 rounded-lg bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] transition-colors"
                        title="Settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Speaker Notes: <span className="text-[var(--orange-primary)]">{title}</span></h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('editor')} className="px-4 py-2 text-sm rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center gap-2">
                        <EditIcon className="w-4 h-4" /> Editor
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Slide List */}
                <aside className="w-80 bg-[#121212] p-4 overflow-y-auto border-r border-r-[#333]">
                    <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2 px-3">Slides</h2>
                    <ul className="space-y-2">
                        {allSlides.map((slide, index) => (
                             <li key={slide.id}>
                                <button
                                    onClick={() => setSelectedSlideId(slide.id)}
                                    className={`w-full text-left p-3 rounded-md transition-colors ${
                                        slide.id === selectedSlideId
                                            ? 'bg-[var(--orange-primary)] text-black font-semibold'
                                            : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                                    }`}
                                >
                                    <span className="text-xs text-gray-400">Slide {index + 1}</span>
                                    <p>{slide.title}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 grid grid-cols-2 gap-8 overflow-y-auto">
                    {selectedSlide ? (
                        <>
                            {/* Slide Preview */}
                            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333]">
                                <h3 className="text-2xl font-bold mb-4">{selectedSlide.title}</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-300">
                                    {selectedSlide.content.map((point, i) => <li key={i}>{point}</li>)}
                                </ul>
                                {selectedSlide.images && selectedSlide.images.length > 0 && (
                                    <div className="mt-6 grid grid-cols-2 gap-2">
                                        {selectedSlide.images.map((image, index) => (
                                            <img 
                                                key={index}
                                                src={`data:${image.mimeType};base64,${image.data}`} 
                                                alt={image.prompt}
                                                className="w-full object-cover rounded-md aspect-video"
                                            />
                                        ))}
                                    </div>
                                )}
                                {selectedSlide.video && (
                                    <div className="mt-6">
                                        <video 
                                            src={`data:${selectedSlide.video.mimeType};base64,${selectedSlide.video.data}`} 
                                            controls
                                            className="max-w-full rounded-md"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Speaker Notes */}
                            <div className="bg-[#1a1a1a] p-6 rounded-lg flex flex-col border border-[#333]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold">Speaker Notes</h3>
                                    <button
                                        onClick={() => handleGenerateNotes(selectedSlide)}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-sm rounded-md bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] flex items-center gap-1.5 disabled:opacity-50 font-bold"
                                    >
                                        {isLoading ? <Spinner className="w-4 h-4"/> : <MicIcon className="w-4 h-4" />}
                                        Generate Notes
                                    </button>
                                </div>
                                <textarea
                                    value={selectedSlide.speakerNotes || ''}
                                    onChange={handleNotesChange}
                                    placeholder="Click 'Generate Notes' or start typing here..."
                                    className="flex-grow w-full bg-[#2a2a2a] p-4 rounded-md focus:ring-1 focus:ring-[var(--orange-primary)] focus:outline-none resize-none text-base leading-relaxed border border-transparent focus:border-[var(--orange-primary)]"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 flex items-center justify-center text-gray-500">
                            <p>Select a slide to view and edit its speaker notes.</p>
                        </div>
                    )}
                </main>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};

export default ScriptGeneratorView;