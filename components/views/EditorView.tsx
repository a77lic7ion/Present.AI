import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { draftContentWithGemini, generateImageWithGemini } from '../../services/geminiService';
import { exportToPptx } from '../../services/pptxService';
import { db } from '../../db';
import type { Slide, ImageContent, VideoContent, Topic } from '../../types';
import { readFile } from '../../utils/fileUtils';

import Logo from '../Logo';
import { DownloadIcon, SaveIcon, EditIcon, MicIcon, PlusIcon, TrashIcon, ImageIcon, SettingsIcon, UploadCloudIcon, SparklesIcon } from '../icons';
import SettingsModal from '../common/SettingsModal';
import LoadProjectModal from '../common/LoadProjectModal';
import ImagePromptModal from '../common/ImagePromptModal';
import SaveProjectModal from '../common/SaveProjectModal';
import Spinner from '../common/Spinner';

const EditorView: React.FC = () => {
    // Component state
    const [isSaving, setIsSaving] = useState(false);
    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isLoadProjectOpen, setLoadProjectOpen] = useState(false);
    const [isImagePromptOpen, setImagePromptOpen] = useState(false);
    const [isGeneratingContent, setGeneratingContent] = useState(false);
    const [isGeneratingImage, setGeneratingImage] = useState(false);
    const [editedContent, setEditedContent] = useState<string[]>([]);
    const [editedTitle, setEditedTitle] = useState('');
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editingTopicTitle, setEditingTopicTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Zustand store selectors
    const { 
        title, topics, currentTopicId, currentSlideId,
        selectSlide, updateSlideContent, updateSlideTitle, setCurrentView,
        addSlideImage, deleteSlideImage, setSlideVideo, deleteSlideVideo,
        setProjectId, setTitle, addTopic, deleteTopic, updateTopicTitle,
        addSlide, deleteSlide,
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
            addSlideImage(currentSlideId, image);
            setImagePromptOpen(false);
        } catch(e) {
            console.error("Failed to generate image:", e);
            alert("Failed to generate image. Please try again.");
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleSaveProject = () => {
        setSaveModalOpen(true);
    };

    const handleConfirmSave = async (projectName: string) => {
        if (!projectName.trim()) {
            alert("Project name cannot be empty.");
            return;
        }
        setIsSaving(true);
        try {
            const existingProject = await db.projects.where('title').equals(projectName).first();
            const projectData = { title: projectName, topics, createdAt: Date.now() };

            if (existingProject?.id) {
                await db.projects.put({ ...projectData, id: existingProject.id });
                setProjectId(existingProject.id);
                setTitle(projectName);
                alert('Project updated successfully!');
            } else {
                const newId = await db.projects.add(projectData);
                setProjectId(newId as number);
                setTitle(projectName);
                alert('Project saved successfully!');
            }
            setSaveModalOpen(false);
        } catch (error) {
            console.error("Failed to save project:", error);
            alert('Error saving project.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || !currentSlideId) return;

        for (const file of Array.from(files)) {
            try {
                const { data, mimeType } = await readFile(file);
                if (file.type.startsWith('image/')) {
                    const image: ImageContent = { data, mimeType, prompt: file.name };
                    addSlideImage(currentSlideId, image);
                } else if (file.type.startsWith('video/')) {
                    const video: VideoContent = { data, mimeType, name: file.name };
                    setSlideVideo(currentSlideId, video);
                } else {
                    alert(`Unsupported file type: ${file.name}. Please upload an image or video.`);
                }
            } catch (error) {
                console.error("Error reading file:", error);
                alert(`Failed to upload file: ${file.name}.`);
            }
        }

        if (event.target) {
            event.target.value = '';
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };
    
    // CRUD Handlers for Topics and Slides
    const handleAddTopic = () => {
        const newTopicTitle = prompt("Enter new topic title:", "New Topic");
        if (newTopicTitle && newTopicTitle.trim()) {
            addTopic(newTopicTitle.trim());
        }
    };

    const handleStartEditTopic = (topic: Topic) => {
        setEditingTopicId(topic.id);
        setEditingTopicTitle(topic.title);
    };
    
    const handleSaveTopicTitle = (topicId: string) => {
        if (editingTopicTitle.trim()) {
            updateTopicTitle(topicId, editingTopicTitle);
        }
        setEditingTopicId(null);
        setEditingTopicTitle('');
    };

    const handleDeleteTopic = (topicId: string) => {
        if (window.confirm("Are you sure you want to delete this topic and all its slides?")) {
            deleteTopic(topicId);
        }
    };
    
    const handleAddSlide = (topicId: string) => {
        const newSlideTitle = prompt("Enter new slide title:", "New Slide");
        if (newSlideTitle && newSlideTitle.trim()) {
            addSlide(topicId, newSlideTitle.trim());
        }
    };
    
    const handleDeleteSlide = (topicId: string, slideId: string) => {
        if (window.confirm("Are you sure you want to delete this slide?")) {
            deleteSlide(topicId, slideId);
        }
    };

    if (!currentSlide) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--dark-void)] text-white">
                <div className="text-center">
                    <p className="text-xl">Your presentation is empty or no slide is selected.</p>
                    <div className="mt-4 space-x-4">
                        <button onClick={handleAddTopic} className="px-4 py-2 bg-[var(--orange-primary)] text-black rounded-lg">
                            Add a Topic
                        </button>
                        <button onClick={() => setCurrentView('brainstorming')} className="px-4 py-2 bg-[#2a2a2a] rounded-lg">
                            Start Over
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex h-screen bg-[var(--dark-void)] text-[var(--text-color)]">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" multiple />
            {/* Sidebar */}
            <aside className="w-80 bg-[#121212] p-4 flex flex-col overflow-y-auto border-r border-r-[#333]">
                <header className="mb-6">
                    <Logo />
                </header>
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-2 px-3">
                        <h2 className="text-sm font-semibold uppercase text-gray-500">Topics</h2>
                        <button onClick={handleAddTopic} className="text-gray-400 hover:text-white" title="Add new topic">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {topics.map(topic => (
                        <div key={topic.id} className="mb-4">
                            <div className="flex items-center justify-between group px-3 py-1 rounded-md hover:bg-[#2a2a2a]/50">
                                {editingTopicId === topic.id ? (
                                    <input
                                        type="text"
                                        value={editingTopicTitle}
                                        onChange={(e) => setEditingTopicTitle(e.target.value)}
                                        onBlur={() => handleSaveTopicTitle(topic.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTopicTitle(topic.id) }}
                                        className="font-bold text-gray-300 bg-transparent border-b border-[var(--orange-primary)] focus:outline-none w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <h3 className="font-bold text-gray-300 truncate flex-1">{topic.title}</h3>
                                )}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleStartEditTopic(topic)} className="text-gray-400 hover:text-white" title="Edit topic title">
                                       <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteTopic(topic.id)} className="text-gray-400 hover:text-red-500" title="Delete topic">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <ul className="mt-1 space-y-1">
                                {topic.subtopics.map(slide => (
                                    <li key={slide.id} className="group relative">
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
                                         <button onClick={() => handleDeleteSlide(topic.id, slide.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete slide">
                                            <TrashIcon className="w-4 h-4 flex-shrink-0" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => handleAddSlide(topic.id)} className="w-full text-left text-sm px-3 py-1.5 mt-1 text-gray-500 hover:text-[var(--orange-primary)] hover:bg-[#2a2a2a] rounded-md flex items-center gap-2">
                                <PlusIcon className="w-4 h-4" /> Add Slide
                            </button>
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
                            {isSaving ? <Spinner className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />} Save
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

                            {/* Right side: Media */}
                            <div className="bg-[#1a1a1a] p-6 rounded-lg flex flex-col items-center justify-center border border-[#333] min-h-[300px]">
                                {currentSlide.images && currentSlide.images.length > 0 ? (
                                    <div className="w-full h-full space-y-2">
                                        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                                            {currentSlide.images.map((image, index) => (
                                                <div key={index} className="relative group aspect-square">
                                                    <img
                                                        src={`data:${image.mimeType};base64,${image.data}`}
                                                        alt={image.prompt}
                                                        className="w-full h-full object-cover rounded-md"
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <button onClick={() => deleteSlideImage(currentSlide.id!, index)} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 justify-center pt-2 border-t border-t-[#333]">
                                            <button onClick={() => setImagePromptOpen(true)} className="px-3 py-1 text-xs rounded-md bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] flex items-center gap-1.5 font-bold">
                                                <SparklesIcon className="w-4 h-4" /> Generate
                                            </button>
                                            <button onClick={triggerFileSelect} className="px-3 py-1 text-xs rounded-md bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center gap-1.5 font-bold">
                                                <UploadCloudIcon className="w-4 h-4" /> Upload
                                            </button>
                                        </div>
                                    </div>
                                ) : currentSlide.video ? (
                                    <div className="relative group w-full h-full">
                                        <video
                                            src={`data:${currentSlide.video.mimeType};base64,${currentSlide.video.data}`}
                                            controls
                                            className="w-full h-full object-contain rounded-md"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button onClick={() => deleteSlideVideo(currentSlide.id!)} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 truncate" title={currentSlide.video.name}>
                                            Source: {currentSlide.video.name}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="w-16 h-16 mx-auto text-gray-600" />
                                        <p className="mt-2 font-semibold">Add Media</p>
                                        <p className="text-sm mb-4">Generate with AI or upload your own file.</p>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => setImagePromptOpen(true)} className="px-3 py-1 text-xs rounded-md bg-[var(--orange-primary)] text-black hover:bg-[var(--orange-secondary)] flex items-center gap-1.5 font-bold">
                                                <SparklesIcon className="w-4 h-4" /> Generate
                                            </button>
                                            <button onClick={triggerFileSelect} className="px-3 py-1 text-xs rounded-md bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center gap-1.5 font-bold">
                                                <UploadCloudIcon className="w-4 h-4" /> Upload
                                            </button>
                                        </div>
                                    </div>
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
                initialPrompt={currentSlide.title}
            />
            <SaveProjectModal
                isOpen={isSaveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                onSave={handleConfirmSave}
                isSaving={isSaving}
                initialName={title}
            />
        </div>
    );
};

export default EditorView;