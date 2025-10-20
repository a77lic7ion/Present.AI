import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  ollamaEndpoint: string;
  setOllamaEndpoint: (endpoint: string) => void;
  openAiApiKey: string;
  setOpenAiApiKey: (key: string) => void;
  mistralApiKey: string;
  setMistralApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ollamaEndpoint: 'http://localhost:11434',
      setOllamaEndpoint: (endpoint) => set({ ollamaEndpoint: endpoint }),
      openAiApiKey: '',
      setOpenAiApiKey: (key) => set({ openAiApiKey: key }),
      mistralApiKey: '',
      setMistralApiKey: (key) => set({ mistralApiKey: key }),
    }),
    {
      name: 'presentai-settings-storage', // name of the item in the storage (must be unique)
    }
  )
);