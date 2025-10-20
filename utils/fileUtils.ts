// FIX: Provided full content for the previously empty utils/fileUtils.ts file.
export const readFile = (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // The result is a data URL: "data:[<mime>];base64,[<data>]"
        // We only want the base64 part
        const base64Data = reader.result.split(',')[1];
        resolve({ data: base64Data, mimeType: file.type });
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

// FIX: Added the missing `readFileAsText` function to resolve an import error in `BrainstormingView.tsx`.
// This function reads a file as a string for processing reference materials.
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};
