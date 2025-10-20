
import React, { useState, useEffect } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { draftContentWithGemini, generateImageWithGemini } from '../../services/geminiService';
import { exportToPptx } from '../../services/pptxService';
import { db } from '../../db';
import type { Slide, ImageContent } from '../../types';

import Logo from '../Logo';
import { DownloadIcon, SaveIcon, EditIcon, MicIcon, PlusIcon, TrashIcon, ImageIcon, SettingsIcon } from '../icons';
import SettingsModal from '../common/SettingsModal';
import LoadProjectModal from '../common/LoadProjectModal';
import ImagePromptModal from '../common/ImagePromptModal';
import Spinner from '../common/Spinner';

const EditorView: React.FC = () => {
    // Component state
    const [isSaving, setIsSaving] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isLoadProjectOpen, setLoadProjectOpen] = useState(false);
    const [isImagePromptOpen, setImagePromptOpen] = useState(false);
    const [isGeneratingContent, setGeneratingContent] = useState(false);
    const [isGeneratingImage, setGeneratingImage] = useState(false);
    const [editedContent, setEditedContent] = useState<string[]>([]);
    const [editedTitle, setEditedTitle] = useState('');

    // Zustand store selectors
    const { 
        title, topics, currentTopicId, currentSlideId,
        selectSlide, updateSlideContent, updateSlideTitle, setCurrentView,
        setSlideImage, deleteSlideImage
    } = usePresentationStore();

    const currentSlide: Slide | undefined = topics
        .flatMap(t => t.subtopics)
        .find(s => s.id === currentSlideId);

    // Effect to update local state when slide changes
    useEffect(() => {
        if (currentSlide) {
            setEditedContent(currentSlide.content);
            setEditedTitle(currentSlide.title);
        }
    }, [currentSlide]);

    const handleContentChange = (index: number, value: string) => {
        const newContent = [...editedContent];
        newContent[index] = value;
        setEditedContent(newContent);
    };

    const addBulletPoint = () => {
        setEditedContent([...editedContent, '']);
    };

    const removeBulletPoint = (index: number) => {
        setEditedContent(editedContent.filter((_, i) => i !== index));
    };

    const handleSaveContent = () => {
        if (currentSlideId) {
            updateSlideContent(currentSlideId, editedContent);
            updateSlideTitle(currentSlideId, editedTitle);
        }
    };
    
    const handleDraftContent = async () => {
        if (!currentSlide) return;
        setGeneratingContent(true);
        try {
            const newContent = await draftContentWithGemini(currentSlide.title, title);
            if (currentSlideId) {
                updateSlideContent(currentSlideId, newContent);
                setEditedContent(newContent); // Update local state as well
            }
        } catch (error) {
            console.error("Failed to draft content:", error);
            alert("Failed to draft content. Please try again.");
        } finally {
            setGeneratingContent(false);
        }
    };

    const handleGenerateImage = async (prompt: string) => {
        if (!currentSlideId) return;
        setGeneratingImage(true);
        try {
            const image: ImageContent = await generateImageWithGemini(prompt);
            setSlideImage(currentSlideId, image);
            setImagePromptOpen(false);
        } catch(e) {
            console.error("Failed to generate image:", e);
            alert("Failed to generate image. Please try again.");
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleSaveProject = async () => {
        setIsSaving(true);
        try {
            const project = { title, topics, createdAt: Date.now() };
            await db.projects.add(project);
            alert('Project saved successfully!');
        } catch (error) {
            console.error("Failed to save project:", error);
            alert('Error saving project.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentSlide) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>No slide selected or presentation empty.</p>
                 <button onClick={() => setCurrentView('brainstorming')} className="ml-4 px-4 py-2 bg-[var(--orange-primary)] text-black rounded-lg">
                    Start Over
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex h-screen bg-[var(--dark-void)] text-[var(--text-color)]">
            {/* Sidebar */}
            <aside className="w-80 bg-[#121212] p-4 flex flex-col overflow-y-auto border-r border-r-[#333]">
                <header className="mb-6">
                    <Logo />
                </header>
                <div className="flex-grow">
                    <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2 px-3">Topics</h2>
                    {topics.map(topic => (
                        <div key={topic.id} className="mb-4">
                            <h3 className="font-bold text-gray-300 px-3">{topic.title}</h3>
                            <ul className="mt-1 space-y-1">
                                {topic.subtopics.map(slide => (
                                    <li key={slide.id}>
                                        <button
                                            onClick={() => {
                                                handleSaveContent(); // Save previous slide's content before switching
                                                selectSlide(topic.id, slide.id);
                                            }}
                                            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                                                slide.id === currentSlideId
                                                    ? 'bg-[var(--orange-primary)] text-black font-semibold'
                                                    : 'text-gray-400 hover:bg-[#2a2a2a]'
                                            }`}
                                        >
                                            {slide.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                 <header className="w-full flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#333] p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="p-2 rounded-lg bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] transition-colors"
                            title="Settings"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-white">{title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentView('script')} className="px-4 py-2 text-sm rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center gap-2">
                            <MicIcon className="w-4 h-4" /> Script
                        </button>
                        <button onClick={handleSaveProject} disabled={isSaving} className="px-4 py-2 text-sm rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center gap-2">
                            <SaveIcon className="w-4 h-4" /> Save
                        </button>
                         <button onClick={() => exportToPptx(title, topics)} className="px-4 py-2 text-sm rounded-md bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] flex items-center gap-2 font-bold">
                            <DownloadIcon className="w-4 h-4" /> Download
                        </button>
                    </div>
                </header>

                {/* Slide Editor */}
                <div className="flex-1 p-8 overflow-y-auto" onBlur={handleSaveContent}>
                    <div className="max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleSaveContent}
                            className="text-4xl font-bold bg-transparent focus:outline-none w-full mb-8 border-b-2 border-transparent focus:border-[var(--orange-primary)] transition-colors"
                        />

                        <div className="grid grid-cols-2 gap-8">
                            {/* Left side: Content */}
                            <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Slide Content</h3>
                                    <button
                                      onClick={handleDraftContent}
                                      disabled={isGeneratingContent}
                                      className="px-3 py-1 text-xs rounded-md bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] flex items-center gap-1 disabled:opacity-50 font-bold"
                                    >
                                      {isGeneratingContent ? <Spinner className="w-3 h-3"/> : <EditIcon className="w-3 h-3" />}
                                      Draft with AI
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {editedContent.map((point, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-[var(--orange-primary)]">&#8226;</span>
                                            <input
                                                type="text"
                                                value={point}
                                                onChange={(e) => handleContentChange(index, e.target.value)}
                                                onBlur={handleSaveContent}
                                                className="w-full bg-[#2a2a2a] p-2 rounded-md focus:ring-1 focus:ring-[var(--orange-primary)] focus:outline-none border border-transparent focus:border-[var(--orange-primary)]"
                                            />
                                            <button onClick={() => removeBulletPoint(index)} className="text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button onClick={addBulletPoint} className="text-sm flex items-center gap-1 text-gray-400 hover:text-white"><PlusIcon className="w-4 h-4" /> Add bullet point</button>
                                </div>
                            </div>

                            {/* Right side: Image */}
                            <div className="bg-[#1a1a1a] p-6 rounded-lg flex flex-col items-center justify-center border border-[#333]">
                                {currentSlide.image ? (
                                    <div className="relative group w-full h-full">
                                        <img
                                            src={`data:${currentSlide.image.mimeType};base64,${currentSlide.image.data}`}
                                            alt={currentSlide.image.prompt}
                                            className="w-full h-full object-contain rounded-md"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button onClick={() => deleteSlideImage(currentSlide.id!)} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 truncate" title={currentSlide.image.prompt}>
                                            Prompt: {currentSlide.image.prompt}
                                        </p>
                                    </div>
                                ) : (
                                    <button onClick={() => setImagePromptOpen(true)} className="text-center text-gray-400 hover:text-white">
                                        <ImageIcon className="w-16 h-16 mx-auto text-gray-600" />
                                        <p className="mt-2 font-semibold">Add an Image</p>
                                        <p className="text-sm">Generate one with AI</p>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
            <LoadProjectModal isOpen={isLoadProjectOpen} onClose={() => setLoadProjectOpen(false)} />
            <ImagePromptModal 
                isOpen={isImagePromptOpen}
                onClose={() => setImagePromptOpen(false)}
                onSubmit={handleGenerateImage}
                isLoading={isGeneratingImage}
                initialPrompt={currentSlide.image?.prompt}
            />
        </div>
    );
};

export default EditorView;