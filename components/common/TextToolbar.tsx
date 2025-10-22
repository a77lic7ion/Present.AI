
import React from 'react';
import { usePresentationStore } from '../../store/presentationStore';

const FONT_FAMILES = [
  'Arial',
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Courier New',
  'Brush Script MT',
];

const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

const TextToolbar: React.FC = () => {
  const { currentSlideId, updateSlideTextProperties, slides } = usePresentationStore();
  const currentSlide = slides.find(s => s.id === currentSlideId);

  if (!currentSlide) {
    return null;
  }

  const { textProperties } = currentSlide;

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSlideTextProperties(currentSlideId, { ...textProperties, fontFamily: e.target.value });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSlideTextProperties(currentSlideId, { ...textProperties, fontSize: Number(e.target.value) });
  };

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Text Properties</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="font-semibold mb-2 text-gray-300 block">Font Family</label>
          <select
            value={textProperties?.fontFamily || 'Arial'}
            onChange={handleFontFamilyChange}
            className="w-full bg-[#2a2a2a] p-2 rounded-md focus:ring-1 focus:ring-[var(--orange-primary)] focus:outline-none border border-transparent focus:border-[var(--orange-primary)]"
          >
            {FONT_FAMILES.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold mb-2 text-gray-300 block">Font Size</label>
          <select
            value={textProperties?.fontSize || 16}
            onChange={handleFontSizeChange}
            className="w-full bg-[#2a2a2a] p-2 rounded-md focus:ring-1 focus:ring-[var(--orange-primary)] focus:outline-none border border-transparent focus:border-[var(--orange-primary)]"
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TextToolbar;
