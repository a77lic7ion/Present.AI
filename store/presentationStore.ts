import { create } from 'zustand';
import type { Topic, Slide, Project, ImageContent } from '../types';

type PresentationView = 'brainstorming' | 'editor' | 'script';

interface PresentationState {
  // Metadata
  title: string;
  currentView: PresentationView;

  // Content
  topics: Topic[];
  
  // State
  currentTopicId: string | null;
  currentSlideId: string | null;

  // Actions
  setTitle: (title: string) => void;
  setTopics: (topics: Topic[]) => void;
  setCurrentView: (view: PresentationView) => void;
  
  // Slide selection
  selectSlide: (topicId: string, slideId: string) => void;
  
  // CRUD operations
  addSlide: (topicId: string, title: string) => void;
  deleteSlide: (topicId: string, slideId: string) => void;
  updateSlideTitle: (slideId: string, newTitle: string) => void;
  updateSlideContent: (slideId: string, content: string[]) => void;
  setSlideImage: (slideId: string, image: ImageContent) => void;
  deleteSlideImage: (slideId: string) => void;
  setSpeakerNotes: (slideId: string, notes: string) => void;

  // Project management
  loadProject: (project: Project) => void;
  resetProject: () => void;
}

const initialState = {
  title: '',
  currentView: 'brainstorming' as PresentationView,
  topics: [],
  currentTopicId: null,
  currentSlideId: null,
};

export const usePresentationStore = create<PresentationState>((set, get) => ({
  ...initialState,

  setTitle: (title) => set({ title }),
  setTopics: (topics) => {
    // When topics are set, automatically select the first slide of the first topic
    const firstTopic = topics[0];
    const firstSlide = firstTopic?.subtopics[0];
    set({
      topics,
      currentTopicId: firstTopic?.id || null,
      currentSlideId: firstSlide?.id || null,
    });
  },
  setCurrentView: (view) => set({ currentView: view }),

  selectSlide: (topicId, slideId) => set({ currentTopicId: topicId, currentSlideId: slideId }),

  addSlide: (topicId, title) => set(state => {
    const newSlide: Slide = { id: `slide-${Math.random()}`, title, content: [] };
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
                // no slides left in this topic
                newCurrentSlideId = null;
                newCurrentTopicId = null; // or select another topic's slide
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

  setSlideImage: (slideId, image) => set(state => ({
    topics: state.topics.map(topic => ({
      ...topic,
      subtopics: topic.subtopics.map(slide => slide.id === slideId ? { ...slide, image } : slide)
    }))
  })),
  
  deleteSlideImage: (slideId) => set(state => ({
    topics: state.topics.map(topic => ({
        ...topic,
        subtopics: topic.subtopics.map(slide => {
            if (slide.id === slideId) {
                const { image, ...rest } = slide;
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
    currentView: 'editor',
    currentTopicId: project.topics[0]?.id || null,
    currentSlideId: project.topics[0]?.subtopics[0]?.id || null,
  }),
  
  resetProject: () => set(initialState),
}));
