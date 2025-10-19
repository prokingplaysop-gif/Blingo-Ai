import React, { useState, useRef, useCallback, useEffect } from 'react';
import { enhanceImage, generateImage } from './services/geminiService';
import Spinner from './components/Spinner';
import Toast from './components/Toast';
import { UploadIcon, SparklesIcon, SaveIcon, PhotographIcon } from './components/Icons';
import ImageSlider from './components/ImageSlider';

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

type Tab = 'enhancer' | 'generator';

const styles = [
  { name: 'Anime', prompt: 'anime style' },
  { name: 'Realistic', prompt: 'photorealistic' },
  { name: 'Cartoon', prompt: 'cartoon style' },
  { name: 'Cinematic', prompt: 'cinematic lighting' },
  { name: '3D Render', prompt: '3D render, high detail' },
  { name: 'Pixel Art', prompt: 'pixel art' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('enhancer');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Enhancer state
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generator state
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatorBaseImage, setGeneratorBaseImage] = useState<ImageFile | null>(null);
  const generatorFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        setOriginalImage({ base64: base64Data, mimeType: file.type, name: file.name });
        setEnhancedImage(null);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleEnhance = async () => {
    if (!originalImage) {
      setError('Please select an image first.');
      return;
    }
    setIsEnhancing(true);
    setError(null);
    setEnhancedImage(null);
    try {
      const result = await enhanceImage(originalImage.base64, originalImage.mimeType);
      setEnhancedImage(`data:image/png;base64,${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveImage = (base64Image: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('Image saved to gallery!');
  };

  const handleGeneratorFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        setGeneratorBaseImage({ base64: base64Data, mimeType: file.type, name: file.name });
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerGeneratorFileSelect = () => {
    generatorFileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !generatorBaseImage) {
      setError('Please enter a prompt or upload an image.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const result = await generateImage(prompt, generatorBaseImage ?? undefined);
      setGeneratedImage(`data:image/png;base64,${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStyleClick = (stylePrompt: string) => {
    setPrompt(prev => prev ? `${prev}, ${stylePrompt}` : stylePrompt);
  };

  const renderEnhancer = () => (
    <div className="p-4 md:p-8 flex-grow flex flex-col">
      <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-2xl flex-grow flex flex-col items-center justify-center relative min-h-[300px] md:min-h-[400px]">
        {isEnhancing && <Spinner message="Enhancing your masterpiece..." />}
        {!isEnhancing && enhancedImage && originalImage && (
          <ImageSlider 
            beforeSrc={`data:${originalImage.mimeType};base64,${originalImage.base64}`} 
            afterSrc={enhancedImage} 
          />
        )}
        {!isEnhancing && !enhancedImage && (
          <div className="text-center p-4">
            <UploadIcon className="w-16 h-16 mx-auto text-gray-500" />
            <h3 className="mt-4 text-xl font-semibold text-gray-300">
              {originalImage ? originalImage.name : 'Upload an image to enhance'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {originalImage ? 'Ready to enhance!' : 'We will improve brightness, sharpness, and resolution.'}
            </p>
            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        <button
          onClick={triggerFileSelect}
          className="w-full sm:w-auto flex-grow bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <UploadIcon className="w-5 h-5" />
          <span>{originalImage ? 'Change Image' : 'Select Image'}</span>
        </button>
        <button
          onClick={handleEnhance}
          disabled={!originalImage || isEnhancing}
          className="w-full sm:w-auto flex-grow bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>Enhance Image</span>
        </button>
        {enhancedImage && (
          <button
            onClick={() => handleSaveImage(enhancedImage, `enhanced-${originalImage?.name || 'image.png'}`)}
            className="w-full sm:w-auto flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <SaveIcon className="w-5 h-5" />
            <span>Save Image</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderGenerator = () => (
    <div className="p-4 md:p-8 flex-grow flex flex-col">
       <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create... e.g., 'An astronaut riding a horse on Mars'"
            className="w-full p-4 pr-16 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300 resize-none h-28"
          />
          <button
            onClick={triggerGeneratorFileSelect}
            title="Upload base image"
            className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          >
            <UploadIcon className="w-6 h-6 text-gray-300" />
          </button>
          <input
            type="file"
            ref={generatorFileInputRef}
            onChange={handleGeneratorFileSelect}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
        </div>
        {generatorBaseImage && (
          <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <img src={`data:${generatorBaseImage.mimeType};base64,${generatorBaseImage.base64}`} alt="preview" className="w-10 h-10 rounded-md object-cover" />
              <span className="text-sm text-gray-400">{generatorBaseImage.name}</span>
            </div>
            <button onClick={() => setGeneratorBaseImage(null)} className="text-red-500 hover:text-red-400 font-bold p-1">&times;</button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-400 self-center mr-2">Quick Styles:</span>
            {styles.map(style => (
              <button
                key={style.name}
                onClick={() => handleStyleClick(style.prompt)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm rounded-full transition-colors"
              >
                {style.name}
              </button>
            ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!prompt.trim() && !generatorBaseImage)}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>Generate Image</span>
        </button>
      </div>
      
      <div className="mt-6 flex-grow flex flex-col items-center justify-center relative min-h-[300px] md:min-h-[400px]">
        {isGenerating && <Spinner message="Generating your vision..." />}
        {!isGenerating && !generatedImage && (
           <div className="w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center text-center p-4">
              <PhotographIcon className="w-16 h-16 mx-auto text-gray-500" />
              <h3 className="mt-4 text-xl font-semibold text-gray-300">Your generated image will appear here</h3>
              <p className="mt-2 text-sm text-gray-500">Let your creativity flow!</p>
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
           </div>
        )}
        {generatedImage && !isGenerating && (
          <div className="w-full h-full flex flex-col items-center gap-4">
            <img src={generatedImage} alt="Generated art" className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg" />
            <button
              onClick={() => handleSaveImage(generatedImage, `generated-${prompt.substring(0, 20).replace(/\s+/g, '_') || 'image'}.png`)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <SaveIcon className="w-5 h-5" />
              <span>Save Image</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <header className="p-4 text-center border-b border-gray-700">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Blingo Enhancer
        </h1>
        <p className="text-gray-400 mt-1">Your AI-Powered Creative Suite</p>
      </header>

      <main className="flex-grow flex flex-col">
        <nav className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('enhancer')}
            className={`flex-1 py-3 px-2 text-center rounded-t-lg transition-colors duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'enhancer'
                ? 'bg-gray-800 text-purple-400'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <SparklesIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Photo Enhancer</span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-3 px-2 text-center rounded-t-lg transition-colors duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'generator'
                ? 'bg-gray-800 text-purple-400'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <PhotographIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Photo Generator</span>
          </button>
        </nav>
        
        <div className="flex-grow flex flex-col bg-gray-800">
            {activeTab === 'enhancer' && renderEnhancer()}
            {activeTab === 'generator' && renderGenerator()}
        </div>

      </main>
      
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
