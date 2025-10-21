export interface ImageContent {
  data: string; // base64 encoded image
  mimeType: string;
  prompt: string;
  originalData?: string; // To store the original image for re-editing
}

export interface VideoContent {
  data: string; // base64 encoded video
  mimeType: string;
  name: string;
}

export interface LayoutProperties {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

export interface Slide {
  id: string;
  title: string;
  content: string[]; // bullet points
  images?: ImageContent[];
  video?: VideoContent;
  speakerNotes?: string;
  textLayout?: LayoutProperties;
  mediaLayout?: LayoutProperties;
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