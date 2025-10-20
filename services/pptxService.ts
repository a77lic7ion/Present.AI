import PptxGenJS from 'pptxgenjs';
import type { Topic, Slide, ImageContent } from '../types';

// Helper function to convert base64 to the format pptxgenjs expects
const formatBase64ForPptx = (image: ImageContent): string => {
    return `data:${image.mimeType};base64,${image.data}`;
};

export const exportToPptx = (presentationTitle: string, topics: Topic[]) => {
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';

    // 1. Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(presentationTitle, {
        x: 0.5,
        y: 2.5,
        w: '90%',
        h: 2,
        align: 'center',
        fontSize: 48,
        bold: true,
        color: '363636'
    });
    titleSlide.addText('Generated with PresentAI', {
        x: 0.5,
        y: 4.5,
        w: '90%',
        h: 1,
        align: 'center',
        fontSize: 18,
        color: '7F7F7F'
    });

    // 2. Iterate through topics and slides
    topics.forEach(topic => {
        // Optional: Add a section header slide for each topic
        const sectionSlide = pptx.addSlide();
        sectionSlide.addText(topic.title, {
            x: 0.5,
            y: 2.75,
            w: '90%',
            h: 1.5,
            align: 'center',
            fontSize: 36,
            bold: true,
            color: '0070C0'
        });

        // Add a slide for each subtopic
        topic.subtopics.forEach(slide => {
            const contentSlide = pptx.addSlide();

            // Slide Title
            contentSlide.addText(slide.title, {
                x: 0.5,
                y: 0.25,
                w: '90%',
                h: 1,
                fontSize: 28,
                bold: true,
                color: '363636'
            });

            // Slide Content (Text and/or Image)
            if (slide.image && slide.content.length > 0) {
                // Layout: Text on left, Image on right
                // FIX: Map the array of strings to an array of TextProps objects, as required by pptxgenjs for bullet points.
                contentSlide.addText(slide.content.map(point => ({ text: point })), {
                    x: 0.5,
                    y: 1.5,
                    w: '45%',
                    h: '75%',
                    bullet: true,
                    fontSize: 18,
                });
                contentSlide.addImage({
                    data: formatBase64ForPptx(slide.image),
                    x: '52%',
                    y: 1.5,
                    w: '45%',
                    h: '75%',
                    sizing: { type: 'contain', w: '45%', h: '75%' }
                });

            } else if (slide.image) {
                // Layout: Image only
                contentSlide.addImage({
                    data: formatBase64ForPptx(slide.image),
                    x: '5%',
                    y: 1.5,
                    w: '90%',
                    h: '75%',
                    sizing: { type: 'contain', w: '90%', h: '75%' }
                });
            } else {
                // Layout: Text only
                // FIX: Map the array of strings to an array of TextProps objects, as required by pptxgenjs for bullet points.
                contentSlide.addText(slide.content.map(point => ({ text: point })), {
                    x: 0.5,
                    y: 1.5,
                    w: '90%',
                    h: '75%',
                    bullet: true,
                    fontSize: 20,
                });
            }
        });
    });

    // 3. Save the presentation
    pptx.writeFile({ fileName: `${presentationTitle.replace(/\s/g, '_')}.pptx` });
};
