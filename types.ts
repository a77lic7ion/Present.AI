export interface ImageContent {
  data: string; // base64 encoded image
  mimeType: string;
  prompt: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string[]; // bullet points
  image?: ImageContent;
  speakerNotes?: string;
}

export interface Topic {
  id: string;
  title: string;
  subtopics: Slide[];
}

export interface Project {
  id?: number; // Optional because it's added by Dexie
  title: string;
  topics: Topic[];
  createdAt: number;
}

export interface Reference {
    type: 'file' | 'url';
    name: string;
    content: string;
}