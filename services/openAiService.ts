import type { Topic, Reference } from '../types';

// This is a mock service.
export const generateTopicsWithOpenAI = (prompt: string, references: Reference[] = []): Promise<Topic[]> => {
  console.log(`(Mock) Generating topics with OpenAI for prompt: ${prompt}`);
  if (references && references.length > 0) {
      console.log('With references:', references);
  }
  
  const dynamicTopics: Topic[] = [
    { id: '1', title: `OpenAI Intro to ${prompt}`, subtopics: [] },
    { id: '2', title: `OpenAI Key Features of ${prompt}`, subtopics: [] },
    { id: '3', title: `OpenAI Use Cases for ${prompt}`, subtopics: [] },
    { id: '4', title: `OpenAI Conclusion`, subtopics: [] },
  ];

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dynamicTopics.map(t => ({...t, id: `topic-openai-${Math.random()}`, subtopics: t.subtopics.map(st => ({...st, id: `slide-openai-${Math.random()}`}))})));
    }, 1000);
  });
};

const mockContent = [
    "- This is a generated bullet point from OpenAI.",
    "- Another point will appear here.",
    "- Content is based on your prompt."
];

export const draftContentWithOpenAI = (prompt: string): Promise<string[]> => {
    console.log(`(Mock) Drafting content with OpenAI for prompt: ${prompt}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockContent);
        }, 1000);
    });
};
