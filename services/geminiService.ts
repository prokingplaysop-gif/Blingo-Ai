import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function enhanceImage(base64ImageData: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: 'Enhance this photo. Improve brightness, sharpness, and overall quality. Reduce noise and upscale the resolution if possible. Make the colors more vibrant but keep them natural. The result should look professional and high-quality.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error('No enhanced image data found in the response.');

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to enhance image due to an API error.");
  }
}

export async function generateImage(prompt: string, baseImage?: { base64: string, mimeType: string }): Promise<string> {
  try {
    const parts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [];
    
    if (baseImage) {
      parts.push({
        inlineData: {
          data: baseImage.base64,
          mimeType: baseImage.mimeType,
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error('No image data found in the response.');
  } catch (error) {
    console.error("Error calling Gemini API for image generation:", error);
    throw new Error("Failed to generate image due to an API error.");
  }
}
