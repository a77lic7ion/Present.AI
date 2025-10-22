
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDragAndResize } from '../../hooks/useDragAndResize';
import { usePresentationStore } from '../../store/presentationStore';
import { draftContentWithGemini, generateImageWithGemini } from '../../services/geminiService';
import { exportToPptx } from '../../services/pptxService';
import { db } from '../../db';
import type { Slide, ImageContent, VideoContent, Topic, LayoutProperties } from '../../types';
import { readFile, readFileAsDataURL } from '../../utils/fileUtils';

import Logo from '../Logo';
import { DownloadIcon, SaveIcon, EditIcon, MicIcon, PlusIcon, TrashIcon, ImageIcon, SettingsIcon, UploadCloudIcon, SparklesIcon, HomeIcon } from '../icons';
import SettingsModal from '../common/SettingsModal';
import LoadProjectModal from '../common/LoadProjectModal';
import ImagePromptModal from '../common/ImagePromptModal';
import SaveProjectModal from '../common/SaveProjectModal';
import ImageEditModal from '../common/ImageCropModal';
import Spinner from '../common/Spinner';
import TextToolbar from '../common/TextToolbar';

interface DraggableResizableBoxProps {
    layout: LayoutProperties;
    onLayoutChange: (layout: LayoutProperties) => void;
    containerRef: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
    className?: string;
}

const DraggableResizableBox: React.FC<DraggableResizableBoxProps> = ({ layout, onLayoutChange, containerRef, children, className }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const { isDragging, isResizing, handleMouseDown } = useDragAndResize(layout, onLayoutChange, containerRef);

    const resizeHandles = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'];

    return (
        <div
            ref={boxRef}
            className={`absolute group cursor-move border-2 border-transparent hover:border-dashed hover:border-[var(--orange-primary)] ${className}`}
            style={{
                left: `${layout.x}%`,
                top: `${layout.y}%`,
                width: `${layout.width}%`,
                height: `${layout.height}%`,
                userSelect: isDragging || isResizing ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
            <div className="w-full h-full overflow-hidden relative">
                {children}
            </div>
            {resizeHandles.map(dir => (
                <div
                    key={dir}
                    className={`absolute w-3 h-3 bg-[var(--orange-primary)] rounded-full opacity-0 group-hover:opacity-100 
                    ${dir.includes('t') ? 'top-[-6px]' : ''} ${dir.includes('b') ? 'bottom-[-6px]' : ''}
                    ${dir.includes('l') ? 'left-[-6px]' : ''} ${dir.includes('r') ? 'right-[-6px]' : ''}
                    ${dir.length === 1 ? (dir === 't' || dir === 'b' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2') : ''}
                    ${dir === 'tl' || dir === 'br' ? 'cursor-nwse-resize' : ''}
                    ${dir === 'tr' || dir === 'bl' ? 'cursor-nesw-resize' : ''}
                    ${dir === 't' || dir === 'b' ? 'cursor-ns-resize' : ''}
                    ${dir === 'l' || dir === 'r' ? 'cursor-ew-resize' : ''}
                    `}
                    onMouseDown={(e) => handleMouseDown(e, 'resize', dir as any)}
                />
            ))}
        </div>
    );
};


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
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [editingImage, setEditingImage] = useState<{src: string; mimeType: string; index?: number} | null>(null);


    // Zustand store selectors
    const { 
        title, topics, currentTopicId, currentSlideId,
        selectSlide, updateSlideContent, updateSlideTitle, setCurrentView,
        addSlideImage, deleteSlideImage, setSlideVideo, deleteSlideVideo,
        setProjectId, setTitle, addTopic, deleteTopic, updateTopicTitle,
        addSlide, deleteSlide, updateSlideLayouts, resetProject, updateSlideImage
    } = usePresentationStore();

    const currentSlide: Slide | undefined = topics
        .flatMap(t => t.subtopics)
        .find(s => s.id === currentSlideId);

    // Resizing logic
    const MIN_SIDEBAR_WIDTH = 250;
    const MAX_SIDEBAR_WIDTH = 600;

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            let newWidth = e.clientX;
            if (newWidth < MIN_SIDEBAR_WIDTH) newWidth = MIN_SIDEBAR_WIDTH;
            if (newWidth > MAX_SIDEBAR_WIDTH) newWidth = MAX_SIDEBAR_WIDTH;
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);
    
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
            updateSlideContent(currentSlideId, editedContent.filter(c => c.trim()));
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

    const handleImageSave = (editedImage: { data: string; mimeType: string; originalData?: string }) => {
        if (currentSlideId) {
            if (editingImage?.index !== undefined) {
                // Updating an existing image
                const newImage: ImageContent = { 
                    ...editedImage, 
                    prompt: currentSlide?.images?.[editingImage.index].prompt || 'User upload (edited)'
                };
                updateSlideImage(currentSlideId, editingImage.index, newImage);

            } else {
                // Adding a new image
                addSlideImage(currentSlideId, { ...editedImage, prompt: 'User upload' });
            }
        }
        setEditingImage(null);
    };


    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentSlideId) return;

        try {
            if (file.type.startsWith('image/')) {
                const dataUrl = await readFileAsDataURL(file);
                setEditingImage({ src: dataUrl, mimeType: file.type });
            } else if (file.type.startsWith('video/')) {
                const { data, mimeType } = await readFile(file);
                const video: VideoContent = { data, mimeType, name: file.name };
                setSlideVideo(currentSlideId, video);
            } else {
                alert(`Unsupported file type: ${file.name}. Please upload an image or video.`);
            }
        } catch (error) {
            console.error("Error reading file:", error);
            alert(`Failed to upload file: ${file.name}.`);
        }

        if (event.target) {
            event.target.value = ''; // Reset file input
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };
    
    const handleEditImage = (image: ImageContent, index: number) => {
        const originalSrc = image.originalData 
            ? `data:${image.mimeType};base64,${image.originalData}` 
            : `data:${image.mimeType};base64,${image.data}`;
        
        setEditingImage({ src: originalSrc, mimeType: image.mimeType, index });
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

    const getInitialLayouts = (slide: Slide): { textLayout?: LayoutProperties; mediaLayout?: LayoutProperties } => {
        const hasMedia = (slide.images && slide.images.length > 0) || !!slide.video;
        const hasContent = slide.content.length > 0 || slide.title.trim() !== '';

        if (hasContent && hasMedia) {
            return {
                textLayout: slide.textLayout || { x: 2.5, y: 5, width: 45, height: 90 },
                mediaLayout: slide.mediaLayout || { x: 52.5, y: 5, width: 45, height: 90 },
            };
        } else if (hasContent) {
            return { textLayout: slide.textLayout || { x: 5, y: 5, width: 90, height: 90 }, mediaLayout: undefined };
        } else if (hasMedia) {
            return { mediaLayout: slide.mediaLayout || { x: 5, y: 5, width: 90, height: 90 }, textLayout: undefined };
        }
        return { textLayout: slide.textLayout || { x: 5, y: 5, width: 90, height: 90 } }; // Default for empty slide
    };

    const handleLayoutUpdate = (type: 'text' | 'media', newLayout: LayoutProperties) => {
        if (currentSlideId) {
            const key = type === 'text' ? 'textLayout' : 'mediaLayout';
            updateSlideLayouts(currentSlideId, { [key]: newLayout });
        }
    };

    useEffect(() => {
        if (currentSlide) {
            const hasMedia = (currentSlide.images && currentSlide.images.length > 0) || !!currentSlide.video;
            const hasContent = currentSlide.content.length > 0 || currentSlide.title.trim() !== '';

            // Automatically adjust layout when media/content is added/removed if no layout is set
            if (!currentSlide.textLayout && !currentSlide.mediaLayout) {
                 if (hasMedia && hasContent) {
                    updateSlideLayouts(currentSlide.id, {
                        textLayout: { x: 2.5, y: 5, width: 45, height: 90 },
                        mediaLayout: { x: 52.5, y: 5, width: 45, height: 90 },
                    });
                }
            }
        }
    }, [currentSlide?.images, currentSlide?.video, currentSlide?.content, currentSlide?.id]);

    const handleTitleBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
        const newTitle = e.currentTarget.innerText;
        setEditedTitle(newTitle);
        updateSlideTitle(currentSlideId!, newTitle);
    };

    const handleContentBlur = (e: React.FocusEvent<HTMLUListElement>) => {
        const newContent = Array.from(e.currentTarget.querySelectorAll('li')).map(li => li.innerText);
        setEditedContent(newContent);
        updateSlideContent(currentSlideId!, newContent);
    };

    const handleNewProject = () => {
        if (window.confirm("Are you sure you want to start a new project? Any unsaved changes will be lost.")) {
            resetProject();
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
    
    const { textLayout, mediaLayout } = getInitialLayouts(currentSlide);
    
    return (
        <div className="flex h-screen bg-[var(--dark-void)] text-[var(--text-color)]">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
            {/* Sidebar */}
            <aside 
                style={{ width: `${sidebarWidth}px` }}
                className="bg-[#121212] p-4 flex flex-col overflow-y-auto border-r border-r-[#333] shrink-0"
            >
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

            {/* Resizer Handle */}
            <div
                onMouseDown={startResizing}
                className="w-1.5 cursor-col-resize bg-transparent hover:bg-[var(--orange-primary)] transition-colors duration-200"
                title="Resize sidebar"
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
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
                <div className="flex-1 p-8 overflow-hidden">
                     <div className="max-w-7xl mx-auto flex flex-col h-full">
                         <div className="flex-1 grid grid-cols-5 gap-8 overflow-hidden">
                            {/* Left side: Editor panels */}
                            <div className="col-span-2 flex flex-col gap-8 overflow-y-auto pr-4">
                                {/* Content */}
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
                                     <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onBlur={handleSaveContent}
                                        placeholder="Slide Title"
                                        className="text-lg font-bold bg-[#2a2a2a] p-2 rounded-md focus:ring-1 focus:ring-[var(--orange-primary)] focus:outline-none w-full mb-4 border border-transparent focus:border-[var(--orange-primary)]"
                                    />
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

                                <TextToolbar />

                                {/* Media */}
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
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                                            <button onClick={() => handleEditImage(image, index)} className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700">
                                                                <EditIcon className="w-5 h-5" />
                                                            </button>
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

                            {/* Right side: Live Preview */}
                            <div className="col-span-3 flex flex-col bg-[#1a1a1a] rounded-lg border border-[#333] p-4">
                                <h3 className="text-sm font-semibold uppercase text-gray-500 text-center mb-4">
                                    Live Preview (Editable)
                                </h3>
                                <div ref={previewContainerRef} className="flex-1 w-full bg-white rounded-md aspect-video overflow-hidden relative">
                                    {textLayout && (
                                        <DraggableResizableBox layout={textLayout} onLayoutChange={(l) => handleLayoutUpdate('text', l)} containerRef={previewContainerRef}>
                                            <div
                                                className="w-full h-full text-black p-4 box-border"
                                                style={{
                                                    fontSize: `${currentSlide.textProperties?.fontSize || 16}px`,
                                                    fontFamily: currentSlide.textProperties?.fontFamily || 'Arial',
                                                }}
                                            >
                                                <h1 className="text-3xl font-bold mb-4 outline-none" contentEditable suppressContentEditableWarning onBlur={handleTitleBlur}>{editedTitle}</h1>
                                                <ul className="space-y-2 list-disc list-inside text-lg outline-none" contentEditable suppressContentEditableWarning onBlur={handleContentBlur}>
                                                    {editedContent.map((point, i) => <li key={i}>{point}</li>)}
                                                </ul>
                                            </div>
                                        </DraggableResizableBox>
                                    )}
                                    {mediaLayout && (
                                        <DraggableResizableBox layout={mediaLayout} onLayoutChange={(l) => handleLayoutUpdate('media', l)} containerRef={previewContainerRef}>
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            {currentSlide.images && currentSlide.images.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                                                    {currentSlide.images.map((img, i) => (
                                                        <img key={i} src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-contain" alt={img.prompt} />
                                                    ))}
                                                </div>
                                            ) : currentSlide.video ? (
                                                <video src={`data:${currentSlide.video!.mimeType};base64,${currentSlide.video!.data}`} controls className="w-full h-full object-contain" />
                                            ) : <ImageIcon className="w-16 h-16 text-gray-400" />}
                                            </div>
                                        </DraggableResizableBox>
                                    )}
                                </div>
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
            {editingImage && (
                <ImageEditModal
                    isOpen={!!editingImage}
                    onClose={() => setEditingImage(null)}
                    onSave={handleImageSave}
                    imageSrc={editingImage.src}
                    imageMimeType={editingImage.mimeType}
                />
            )}
        </div>
    );
};

export default EditorView;