import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Reference, Topic, Slide, ImageContent } from "../types";
import { useSettingsStore } from '../store/settingsStore';

// Helper function to get an initialized AI client
const getAiClient = (): GoogleGenAI => {
    const apiKey = useSettingsStore.getState().geminiApiKey;
    if (!apiKey) {
        throw new Error("Gemini API key is not set. Please add it in the settings panel.");
    }
    return new GoogleGenAI({ apiKey });
};

const model = 'gemini-2.5-flash';
const REFERENCE_CONTENT_CHAR_LIMIT = 20000; // Limit each reference file to 20k chars

/**
 * Tests the connection to the Gemini API by making a simple request.
 * @param apiKey The API key to test.
 * @returns A promise that resolves to true if the connection is successful, false otherwise.
 */
export const testGeminiConnection = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: model,
            contents: "hello",
        });
        return true;
    } catch (e) {
        console.error("Gemini API connection test failed:", e);
        return false;
    }
};


/**
 * Generates a presentation outline (topics and subtopics) using the Gemini API.
 * @param prompt The main subject of the presentation.
 * @param references Optional reference materials to guide the generation.
 * @returns A promise that resolves to an array of Topic objects.
 */
export const generateTopicsWithGemini = async (prompt: string, references: Reference[]): Promise<Topic[]> => {
    const ai = getAiClient();
    let fullPrompt = `You are an expert presentation creator. Generate a structured outline for a presentation about "${prompt}". The outline should consist of several main topics, and each main topic should have a few subtopics. Each subtopic will become a slide.

    The response must be a JSON array of topics. Each topic object should have a "title" (string) and "subtopics" (an array of objects, where each object has a "title" (string)). Do not include any other properties.
    
    Example response format:
    [
        {
            "title": "Introduction to Topic",
            "subtopics": [
                { "title": "What is Topic?" },
                { "title": "Importance of Topic" }
            ]
        },
        {
            "title": "Core Concepts",
            "subtopics": [
                { "title": "Concept A" },
                { "title": "Concept B" }
            ]
        }
    ]`;

    if (references.length > 0) {
        fullPrompt += `\n\nUse the following reference material to inform the outline:\n`;
        references.forEach(ref => {
            const truncatedContent = ref.content.length > REFERENCE_CONTENT_CHAR_LIMIT
                ? `${ref.content.substring(0, REFERENCE_CONTENT_CHAR_LIMIT)}... [Content Truncated]`
                : ref.content;
            fullPrompt += `\n--- Reference: ${ref.name} ---\n${truncatedContent}\n--- End Reference ---`;
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "The main topic title."
                            },
                            subtopics: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: {
                                            type: Type.STRING,
                                            description: "The subtopic title, which will be the slide title."
                                        }
                                    },
                                    required: ['title']
                                }
                            }
                        },
                        required: ['title', 'subtopics']
                    }
                }
            }
        });
        
        const jsonString = response.text;
        const topics = JSON.parse(jsonString);
        // Map the generated structure to our application's data types.
        return topics.map((topic: any) => ({
            id: `topic-${Math.random()}`,
            title: topic.title,
            subtopics: topic.subtopics.map((sub: any) => ({
                id: `slide-${Math.random()}`,
                title: sub.title,
                content: [],
            }))
        }));
    } catch (e) {
        if (e instanceof Error && e.message.includes('API key not valid')) {
             throw new Error("Invalid Gemini API key. Please check it in the settings.");
        }
        console.error("Failed to parse JSON response from Gemini:", e);
        throw new Error("Received an invalid format from the AI. Please try again.");
    }
};

/**
 * Drafts bullet-point content for a single presentation slide.
 * @param slideTitle The title of the slide.
 * @param presentationTitle The overall title of the presentation for context.
 * @returns A promise that resolves to an array of strings (bullet points).
 */
export const draftContentWithGemini = async (slideTitle: string, presentationTitle: string): Promise<string[]> => {
    const ai = getAiClient();
    const fullPrompt = `For a presentation titled "${presentationTitle}", generate 3-5 concise bullet points for a slide with the title "${slideTitle}". The bullet points should be suitable for a presentation slide, meaning they should be short and to the point.
    
    Return the response as a JSON array of strings. Each string is one bullet point. Do not use markdown formatting.
    
    Example response format:
    [
        "This is the first bullet point.",
        "This is the second bullet point.",
        "This is the third bullet point."
    ]`;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });

        const jsonString = response.text;
        const content = JSON.parse(jsonString);
        // Clean up any potential markdown list characters.
        return content.map((point: string) => point.replace(/^- \s*/, ''));
    } catch (e) {
        if (e instanceof Error && e.message.includes('API key not valid')) {
             throw new Error("Invalid Gemini API key. Please check it in the settings.");
        }
        console.error("Failed to parse JSON response from Gemini:", e);
        throw new Error("Received an invalid format from the AI. Please try again.");
    }
};

/**
 * Generates an image based on a text prompt.
 * @param prompt The description of the image to generate.
 * @returns A promise that resolves to an ImageContent object containing base64 data and mimeType.
 */
export const generateImageWithGemini = async (prompt: string): Promise<ImageContent> => {
    const ai = getAiClient();
    const imageModel = 'gemini-2.5-flash-image';
    
    try {
        const response = await ai.models.generateContent({
          model: imageModel,
          contents: {
            parts: [
              { text: prompt },
            ],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
                prompt: prompt,
            };
          }
        }
    } catch(e) {
        if (e instanceof Error && e.message.includes('API key not valid')) {
             throw new Error("Invalid Gemini API key. Please check it in the settings.");
        }
        console.error("Failed to generate image with Gemini:", e);
        throw new Error("Failed to generate image. Please check your prompt or API settings.");
    }

    throw new Error("No image was generated by the AI.");
};

/**
 * Generates speaker notes for a given slide.
 * @param slide The slide object containing title and content.
 * @param presentationTitle The overall title of the presentation for context.
 * @returns A promise that resolves to a string of speaker notes.
 */
export const generateSpeakerNotesWithGemini = async (slide: Slide, presentationTitle: string): Promise<string> => {
    const ai = getAiClient();
    const slideTextContent = slide.content.map(p => `- ${p}`).join('\n');
    
    let fullPrompt = `You are a presentation coach. For a presentation titled "${presentationTitle}", write speaker notes for a slide titled "${slide.title}".
    
    The content on the slide consists of these bullet points:
    ${slideTextContent}
    
    The speaker notes should elaborate on the bullet points, provide context, and perhaps suggest a transition to the next slide. The notes should be in a conversational and engaging tone. Write a few paragraphs. Return only the notes as plain text, without any markdown or titles.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
        });
        
        return response.text;
    } catch(e) {
        if (e instanceof Error && e.message.includes('API key not valid')) {
             throw new Error("Invalid Gemini API key. Please check it in the settings.");
        }
        console.error("Failed to generate speaker notes with Gemini:", e);
        throw new Error("Failed to generate speaker notes.");
    }
};
