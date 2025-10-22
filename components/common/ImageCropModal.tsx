
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Spinner from './Spinner';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: { data: string, mimeType: string, originalData?: string }) => void;
  imageSrc: string;
  imageMimeType: string;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, onSave, imageSrc, imageMimeType }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [filter, setFilter] = useState('none');

  const resetState = useCallback(() => {
    setCrop(undefined);
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setFilter('none');
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const applyEditsAndCrop = async () => {
    if (!imgRef.current || !crop?.width || !crop?.height) {
        alert('Please select a crop area.');
        return;
    }
    
    setIsSaving(true);
    try {
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        const pixelCrop = {
            x: Math.round((crop.x / 100) * image.naturalWidth),
            y: Math.round((crop.y / 100) * image.naturalHeight),
            width: Math.round((crop.width / 100) * image.naturalWidth),
            height: Math.round((crop.height / 100) * image.naturalHeight),
        };

        // Adjust canvas size for rotation
        const swapDimensions = Math.abs(rotation % 180) === 90;
        const rotatedWidth = swapDimensions ? pixelCrop.height : pixelCrop.width;
        const rotatedHeight = swapDimensions ? pixelCrop.width : pixelCrop.height;
        
        canvas.width = rotatedWidth;
        canvas.height = rotatedHeight;

        // Apply visual filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${filter === 'grayscale' ? 'grayscale(100%)' : ''} ${filter === 'sepia' ? 'sepia(100%)' : ''}`;
        
        // Center the canvas context for rotation, then rotate
        ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
        ctx.rotate(rotation * Math.PI / 180);

        // Draw the cropped portion of the source image.
        // The negative offset centers the cropped image on the rotated canvas.
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            -pixelCrop.width / 2,
            -pixelCrop.height / 2,
            pixelCrop.width,
            pixelCrop.height
        );
        
        const editedDataUrl = canvas.toDataURL(imageMimeType);
        const editedBase64 = editedDataUrl.split(',')[1];
        const originalBase64 = imageSrc.split(',')[1];

        onSave({
            data: editedBase64,
            mimeType: imageMimeType,
            originalData: originalBase64
        });
        
        onClose(); // Close modal on successful save

    } catch (e) {
      console.error('Error while saving image:', e);
      alert('Could not save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--dark-void)] border border-[#333] rounded-lg shadow-xl p-6 w-full max-w-6xl m-4 flex flex-col h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-white">Edit Image</h2>
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Controls */}
          <div className="w-72 bg-[#1a1a1a] p-4 rounded-lg flex flex-col space-y-6 overflow-y-auto">
             <div>
                <h3 className="font-semibold mb-2 text-gray-300">Rotate</h3>
                <div className="flex gap-2">
                    <button onClick={() => setRotation(r => r - 90)} className="w-full py-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a]">Rotate Left</button>
                    <button onClick={() => setRotation(r => r + 90)} className="w-full py-2 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a]">Rotate Right</button>
                </div>
            </div>
            <div>
                <label className="font-semibold mb-2 text-gray-300 block">Brightness: {brightness}%</label>
                <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full" />
            </div>
             <div>
                <label className="font-semibold mb-2 text-gray-300 block">Contrast: {contrast}%</label>
                <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full" />
            </div>
            <div>
                <h3 className="font-semibold mb-2 text-gray-300">Filters</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <button onClick={() => setFilter('none')} className={`py-2 rounded ${filter === 'none' ? 'bg-[var(--orange-primary)] text-black' : 'bg-[#2a2a2a]'}`}>None</button>
                    <button onClick={() => setFilter('grayscale')} className={`py-2 rounded ${filter === 'grayscale' ? 'bg-[var(--orange-primary)] text-black' : 'bg-[#2a2a2a]'}`}>Grayscale</button>
                    <button onClick={() => setFilter('sepia')} className={`py-2 rounded ${filter === 'sepia' ? 'bg-[var(--orange-primary)] text-black' : 'bg-[#2a2a2a]'}`}>Sepia</button>
                </div>
            </div>
            <div className="flex-grow"></div>
            <button onClick={resetState} className="w-full py-2 bg-gray-600 rounded hover:bg-gray-700 font-bold">Reset All</button>
          </div>

          {/* Image Preview */}
          <div className="flex-grow flex items-center justify-center bg-black/50 rounded-lg p-4">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              className="max-h-full"
            >
              <img 
                ref={imgRef} 
                src={imageSrc} 
                onLoad={onImageLoad} 
                alt="Crop preview" 
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${filter === 'grayscale' ? 'grayscale(100%)' : ''} ${filter === 'sepia' ? 'sepia(100%)' : ''}`,
                  maxHeight: '100%',
                  maxWidth: '100%'
                }} 
              />
            </ReactCrop>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-t-[#333]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyEditsAndCrop}
            disabled={isSaving || !crop?.width || !crop?.height}
            className="px-6 py-2 rounded-lg bg-[var(--orange-primary)] text-black font-bold hover:bg-[var(--orange-secondary)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Spinner className="w-4 h-4" /> : null}
            {isSaving ? 'Saving...' : 'Apply & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;
