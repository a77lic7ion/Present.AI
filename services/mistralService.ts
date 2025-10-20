import type { Topic, Reference } from '../types';

// This is a mock service.
export const generateTopicsWithMistral = (prompt: string, references: Reference[] = []): Promise<Topic[]> => {
  console.log(`(Mock) Generating topics with Mistral for prompt: ${prompt}`);
  if (references && references.length > 0) {
      console.log('With references:', references);
  }
  
  const dynamicTopics: Topic[] = [
    { id: '1', title: `Mistral Intro to ${prompt}`, subtopics: [] },
    { id: '2', title: `Mistral Key Features of ${prompt}`, subtopics: [] },
    { id: '3', title: `Mistral Use Cases for ${prompt}`, subtopics: [] },
    { id: '4', title: `Mistral Conclusion`, subtopics: [] },
  ];

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dynamicTopics.map(t => ({...t, id: `topic-mistral-${Math.random()}`, subtopics: t.subtopics.map(st => ({...st, id: `slide-mistral-${Math.random()}`}))})));
    }, 1000);
  });
};

const mockContent = [
    "- This is a generated bullet point from Mistral.",
    "- Another point will appear here.",
    "- Content is based on your prompt."
];

export const draftContentWithMistral = (prompt: string): Promise<string[]> => {
    console.log(`(Mock) Drafting content with Mistral for prompt: ${prompt}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockContent);
        }, 1000);
    });
};
