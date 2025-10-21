import PptxGenJS from 'pptxgenjs';
import type { Topic, Slide, ImageContent, VideoContent } from '../types';

// Helper function to convert base64 to the format pptxgenjs expects
const formatBase64ForPptx = (media: ImageContent | VideoContent): string => {
    return `data:${media.mimeType};base64,${media.data}`;
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

            // Slide Content (Text and/or Media)
            const hasImages = slide.images && slide.images.length > 0;
            const hasVideo = slide.video;
            const hasContent = slide.content.length > 0;

            if ((hasImages || hasVideo) && hasContent) {
                // Layout: Text on left, Media on right
                contentSlide.addText(slide.content.map(point => ({ text: point })), {
                    x: 0.5,
                    y: 1.5,
                    w: '45%',
                    h: '75%',
                    bullet: true,
                    fontSize: 18,
                });
                if (hasImages) {
                    const imagesToShow = slide.images!.slice(0, 4);
                    const numImages = imagesToShow.length;
                    const imgW = numImages > 1 ? '22%' : '45%';
                    const imgH = numImages > 2 ? '37%' : '75%';
                    imagesToShow.forEach((image, index) => {
                        // FIX: Replaced complex let/if block with ternary operators to ensure correct type inference for x and y coordinates.
                        // The 'Coord' type in PptxGenJS requires a number or a specific percentage-formatted string.
                        const x = (numImages > 1 && index % 2 !== 0) ? '75%' : '52%';
                        const y = (numImages > 1 && index > 1) ? '53%' : 1.5;
                         contentSlide.addImage({ data: formatBase64ForPptx(image), x, y, w: imgW, h: imgH, sizing: { type: 'contain', w: '100%', h: '100%' }});
                    });
                } else if (hasVideo) {
                    contentSlide.addMedia({
                        type: 'video',
                        data: formatBase64ForPptx(slide.video!),
                        x: '52%',
                        y: 1.5,
                        w: '45%',
                        h: '75%',
                    });
                }
            } else if (hasImages) {
                // Layout: Images only
                const imagesToShow = slide.images!.slice(0, 4);
                const numImages = imagesToShow.length;
                const imgW = numImages > 1 ? '44%' : '90%';
                const imgH = numImages > 2 ? '37%' : '75%';
                 imagesToShow.forEach((image, index) => {
                    // FIX: Replaced complex let/if block with ternary operators to ensure correct type inference for x and y coordinates.
                    // The 'Coord' type in PptxGenJS requires a number or a specific percentage-formatted string.
                    const x = (numImages > 1 && index % 2 !== 0) ? '51%' : '5%';
                    const y = (numImages > 1 && index > 1) ? '53%' : 1.5;
                    contentSlide.addImage({ data: formatBase64ForPptx(image), x, y, w: imgW, h: imgH, sizing: { type: 'contain', w: '100%', h: '100%' } });
                });
            } else if (hasVideo) {
                // Layout: Video only
                contentSlide.addMedia({
                    type: 'video',
                    data: formatBase64ForPptx(slide.video!),
                    x: '5%',
                    y: 1.5,
                    w: '90%',
                    h: '75%',
                });
            } else {
                // Layout: Text only
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
