import { create } from 'zustand';
import type { Topic, Slide, Project, ImageContent, VideoContent, LayoutProperties } from '../types';

type PresentationView = 'brainstorming' | 'editor' | 'script';

interface PresentationState {
  // Metadata
  title: string;
  projectId: number | null;
  currentView: PresentationView;

  // Content
  topics: Topic[];
  
  // State
  currentTopicId: string | null;
  currentSlideId: string | null;

  // Actions
  setTitle: (title: string) => void;
  setProjectId: (id: number | null) => void;
  setTopics: (topics: Topic[]) => void;
  setCurrentView: (view: PresentationView) => void;
  
  // Slide selection
  selectSlide: (topicId: string, slideId: string) => void;
  
  // CRUD operations
  addTopic: (title: string) => void;
  deleteTopic: (topicId: string) => void;
  updateTopicTitle: (topicId: string, newTitle: string) => void;
  addSlide: (topicId: string, title: string) => void;
  deleteSlide: (topicId: string, slideId: string) => void;
  updateSlideTitle: (slideId: string, newTitle: string) => void;
  updateSlideContent: (slideId: string, content: string[]) => void;
  updateSlideLayouts: (slideId: string, layouts: { textLayout?: LayoutProperties; mediaLayout?: LayoutProperties }) => void;
  addSlideImage: (slideId: string, image: ImageContent) => void;
  updateSlideImage: (slideId: string, imageIndex: number, newImage: ImageContent) => void;
  deleteSlideImage: (slideId: string, imageIndex: number) => void;
  setSlideVideo: (slideId: string, video: VideoContent) => void;
  deleteSlideVideo: (slideId: string) => void;
  setSpeakerNotes: (slideId: string, notes: string) => void;

  // Project management
  loadProject: (project: Project) => void;
  resetProject: () => void;
}

const initialState = {
  title: '',
  projectId: null,
  currentView: 'brainstorming' as PresentationView,
  topics: [],
  currentTopicId: null,
  currentSlideId: null,
};

export const usePresentationStore = create<PresentationState>((set, get) => ({
  ...initialState,

  setTitle: (title) => set({ title }),
  setProjectId: (id) => set({ projectId: id }),
  setTopics: (topics) => {
    // When topics are set, it's a new presentation structure.
    // Reset project ID and select the first slide.
    const firstTopic = topics[0];
    const firstSlide = firstTopic?.subtopics[0];
    set({
      topics,
      projectId: null,
      currentTopicId: firstTopic?.id || null,
      currentSlideId: firstSlide?.id || null,
    });
  },
  setCurrentView: (view) => set({ currentView: view }),

  selectSlide: (topicId, slideId) => set({ currentTopicId: topicId, currentSlideId: slideId }),

  addTopic: (title) => set(state => {
    const newTopic: Topic = { id: `topic-${Math.random()}`, title, subtopics: [] };
    const newTopics = [...state.topics, newTopic];
    return { topics: newTopics };
  }),

  deleteTopic: (topicId) => set(state => {
    const newTopics = state.topics.filter(topic => topic.id !== topicId);
    let { currentTopicId, currentSlideId } = state;

    if (currentTopicId === topicId) {
        const firstTopic = newTopics[0];
        const firstSlide = firstTopic?.subtopics[0];
        currentTopicId = firstTopic?.id || null;
        currentSlideId = firstSlide?.id || null;
    }
    
    return { topics: newTopics, currentTopicId, currentSlideId };
  }),

  updateTopicTitle: (topicId, newTitle) => set(state => ({
    topics: state.topics.map(topic => 
      topic.id === topicId ? { ...topic, title: newTitle } : topic
    )
  })),

  addSlide: (topicId, title) => set(state => {
    const newSlide: Slide = { 
        id: `slide-${Math.random()}`, 
        title, 
        content: [],
        textLayout: { x: 5, y: 5, width: 90, height: 90 } // Default layout for a new slide
    };
    const newTopics = state.topics.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, subtopics: [...topic.subtopics, newSlide] };
      }
      return topic;
    });
    return { topics: newTopics, currentTopicId: topicId, currentSlideId: newSlide.id };
  }),

  deleteSlide: (topicId, slideId) => set(state => {
    let newCurrentSlideId = state.currentSlideId;
    let newCurrentTopicId = state.currentTopicId;
    
    const newTopics = state.topics.map(topic => {
      if (topic.id === topicId) {
        const slideIndex = topic.subtopics.findIndex(s => s.id === slideId);
        if (slideIndex === -1) return topic;

        const newSubtopics = topic.subtopics.filter(s => s.id !== slideId);

        if (state.currentSlideId === slideId) {
            if (newSubtopics.length > 0) {
                // select previous or first slide
                newCurrentSlideId = newSubtopics[Math.max(0, slideIndex - 1)].id;
            } else {
                // no slides left in this topic, try to find another slide
                const otherTopicWithSlides = state.topics.find(t => t.id !== topicId && t.subtopics.length > 0);
                if (otherTopicWithSlides) {
                    newCurrentTopicId = otherTopicWithSlides.id;
                    newCurrentSlideId = otherTopicWithSlides.subtopics[0].id;
                } else {
                    newCurrentSlideId = null;
                    newCurrentTopicId = null;
                }
            }
        }
        
        return { ...topic, subtopics: newSubtopics };
      }
      return topic;
    });
    return { topics: newTopics, currentSlideId: newCurrentSlideId, currentTopicId: newCurrentTopicId };
  }),

  updateSlideTitle: (slideId, newTitle) => set(state => ({
    topics: state.topics.map(topic => ({
      ...topic,
      subtopics: topic.subtopics.map(slide => slide.id === slideId ? { ...slide, title: newTitle } : slide)
    }))
  })),

  updateSlideContent: (slideId, content) => set(state => ({
    topics: state.topics.map(topic => ({
      ...topic,
      subtopics: topic.subtopics.map(slide => slide.id === slideId ? { ...slide, content } : slide)
    }))
  })),

  updateSlideLayouts: (slideId, layouts) => set(state => ({
    topics: state.topics.map(topic => ({
      ...topic,
      subtopics: topic.subtopics.map(slide => {
        if (slide.id === slideId) {
          return { ...slide, ...layouts };
        }
        return slide;
      })
    }))
  })),

  addSlideImage: (slideId, image) => set(state => ({
    topics: state.topics.map(topic => ({
      ...topic,
      subtopics: topic.subtopics.map(slide => {
        if (slide.id === slideId) {
          const { video, ...rest } = slide; // remove video if adding an image
          const newImages = [...(slide.images || []), image];
          return { ...rest, images: newImages };
        }
        return slide;
      })
    }))
  })),
  
  updateSlideImage: (slideId, imageIndex, newImage) => set(state => ({
    topics: state.topics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(slide => {
            if (slide.id === slideId && slide.images) {
                const newImages = [...slide.images];
                newImages[imageIndex] = newImage;
                return { ...slide, images: newImages };
            }
            return slide;
        })
    }))
  })),

  deleteSlideImage: (slideId, imageIndex) => set(state => ({
    topics: state.topics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(slide => {
            if (slide.id === slideId && slide.images) {
                const newImages = slide.images.filter((_, index) => index !== imageIndex);
                return { ...slide, images: newImages };
            }
            return slide;
        })
    }))
  })),
  
  setSlideVideo: (slideId, video) => set(state => ({
    topics: state.topics.map(topic => ({
      ...topic,
      subtopics: topic.subtopics.map(slide => {
        if (slide.id === slideId) {
          const { images, ...rest } = slide; // remove images if adding a video
          return { ...rest, video };
        }
        return slide;
      })
    }))
  })),

  deleteSlideVideo: (slideId) => set(state => ({
    topics: state.topics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(slide => {
            if (slide.id === slideId) {
                const { video, ...rest } = slide;
                return rest;
            }
            return slide;
        })
    }))
  })),

  setSpeakerNotes: (slideId, notes) => set(state => ({
    topics: state.topics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(slide => slide.id === slideId ? { ...slide, speakerNotes: notes } : slide)
    }))
  })),

  loadProject: (project) => set({
    title: project.title,
    topics: project.topics,
    projectId: project.id || null,
    currentView: 'editor',
    currentTopicId: project.topics[0]?.id || null,
    currentSlideId: project.topics[0]?.subtopics[0]?.id || null,
  }),
  
  resetProject: () => set(initialState),
}));