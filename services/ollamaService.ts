import type { Topic, Reference } from '../types';
import { useSettingsStore } from '../store/settingsStore';

export const testEndpoint = async (endpoint: string): Promise<boolean> => {
    if (!endpoint) return false;
    try {
        const response = await fetch(endpoint);
        return response.ok;
    } catch (error) {
        console.error("Ollama endpoint test failed:", error);
        return false;
    }
}

// This is still a mock service, but it now generates topics based on the prompt.
export const generateTopicsWithOllama = (prompt: string, references: Reference[] = []): Promise<Topic[]> => {
  const endpoint = useSettingsStore.getState().ollamaEndpoint;
  console.log(`Generating topics with Ollama for prompt: ${prompt} using endpoint ${endpoint}`);
  if (references && references.length > 0) {
      console.log('With references:', references);
  }
  
  const dynamicTopics: Topic[] = [
    { id: '1', title: `Introduction to ${prompt}`, subtopics: [] },
    { id: '2', title: `Key Features and Technology of ${prompt}`, subtopics: [] },
    { id: '3', title: `Applications and Use Cases for ${prompt}`, subtopics: [] },
    { id: '4', title: `Comparing ${prompt} with Competitors`, subtopics: [] },
    { id: '5', title: `Future Trends and Innovations in ${prompt}`, subtopics: [] },
    { id: '6', title: `Conclusion and Q&A`, subtopics: [] },
  ];

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dynamicTopics.map(t => ({...t, id: `topic-${Math.random()}`})));
    }, 1000);
  });
};

const mockContent = [
    "- This is a generated bullet point from Ollama.",
    "- Another point will appear here.",
    "- Content is based on your prompt."
];

export const draftContentWithOllama = (prompt: string): Promise<string[]> => {
    console.log(`Drafting content with Ollama for prompt: ${prompt}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockContent);
        }, 1000);
    });
};