
<img width="500" height="500" alt="logo(1)" src="https://github.com/user-attachments/assets/baea8439-9155-4a2c-ad17-bcc2326aae52" />

Welcome to **Present.AI**, the futuristic, AI-powered presentation design suite. Engage with a powerful AI through a conversational data stream to brainstorm, generate, and refine entire presentations from a single idea.

## 🚀 Core Features

Present.AI is designed to be an end-to-end solution for creating compelling presentations with maximum efficiency and creativity.

-   **🤖 Conversational AI Brainstorming**: Start your project in the "AI Data Stream Interface," a terminal-style view where you can conversationally interact with the AI to generate a structured presentation outline.
-   **📚 Context-Aware Generation**: Feed the AI with reference materials through the "Data Conduit." You can upload local files (`.txt`, `.md`, `.html`, `.pdf`, `.docx`, `.pptx`) or provide public URLs to ensure the generated content is accurate and highly relevant.
-   **🔌 Multi-Model Support**: Connect to your favorite AI providers. The application has built-in support for **Google Gemini** and allows you to configure endpoints and API keys for **Ollama**, **OpenAI**, and **Mistral** via the "Connectors" settings panel.
-   **✍️ AI-Powered Content Drafting**: For any slide, click "Draft with AI" to have the model generate concise, relevant bullet points based on the slide's title and the overall presentation context.
-   **🖼️ AI Image Generation**: Generate stunning, relevant images for your slides. Simply describe the visual you need, and the AI will create it for you.
-   **🎙️ Speaker Notes Generation**: Move to the dedicated "Script" view to automatically generate detailed speaker notes for each slide, helping you prepare for delivery.
-   **💾 Full Project Management**: All your presentations are automatically saved locally in your browser. The "Load" functionality lets you revisit and continue working on any of your past projects.
-   **📊 PowerPoint Export**: With a single click, export your entire presentation—including all topics, slides, content, images, and speaker notes—into a fully-formatted `.pptx` file, ready for your meeting.

## 🛠️ Tech Stack

This application is built with a modern, powerful, and efficient technology stack:

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **State Management**: Zustand
-   **Local Database**: Dexie.js (IndexedDB wrapper)
-   **PowerPoint Generation**: PptxGenJS
-   **AI Integration**: @google/genai SDK

## ⚙️ Getting Started & Workflow

The workflow is designed to be intuitive, guiding you from a simple idea to a complete presentation.

1.  **Start the Stream**: On the main screen, type your presentation topic into the terminal.


<img width="1891" height="870" alt="slide5" src="https://github.com/user-attachments/assets/acbe2712-a2c2-4b77-b159-4fc5644950e7" />


2.  **Provide Context (Optional)**: Drag and drop reference files or add URLs into the "Data Conduit" to give the AI more information.


<img width="1910" height="877" alt="slide3" src="https://github.com/user-attachments/assets/4d0abd76-2884-4a83-8756-18e0cd53691a" />


3.  **Initiate Protocol**: Click "Initiate Presentation Protocol." The AI will process your request and generate a structured outline of topics and slides.


<img width="508" height="406" alt="slide4" src="https://github.com/user-attachments/assets/3a9b37e3-4653-4775-bb83-ce17a45af73d" />


4.  **Enter the Editor**: The application will automatically transition to the Editor view, where your new presentation outline is loaded.


<img width="1910" height="877" alt="slide3" src="https://github.com/user-attachments/assets/c8277ca6-6e42-4002-aa58-219c4354300f" />


5.  **Refine & Enhance**:
    -   Click on any slide in the sidebar to view it.
    -   Edit slide titles and bullet points directly.
    -   Use the "Draft with AI" button to generate content.
    -   Use the "Generate Image" button to create visuals.

    
6.  **Generate a Script**: Navigate to the "Script" view to generate and review speaker notes for each slide.


<img width="1891" height="870" alt="slide5" src="https://github.com/user-attachments/assets/773436ad-ddd4-46cf-9a10-8eff21bcd3a2" />


7.  **Save & Export**: Your project is saved automatically. When you're finished, click "Download" in the editor to get your `.pptx` file.

## 🔧 Configuration

You can customize the AI providers used by the application:


<img width="519" height="559" alt="slide2" src="https://github.com/user-attachments/assets/513ca683-7d50-4a08-9b94-1ea7182fc023" />


-   Click the **Connectors** button (the plug icon) in the header to open the settings modal.
-   **Google Gemini**: This is the default provider and is configured securely using environment variables. No setup is needed.
-   **Ollama, OpenAI, Mistral**: You can enter your custom endpoints and/or API keys for these services. Use the "Test" button to ensure your configuration is working correctly before saving.

You can preview the live version here

https://present-ai-seven.vercel.app/

Created by **AfflictedAI** 2025
