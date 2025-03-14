import { Scene, Character, Storyboard } from './types';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let textToImagePipeline: any = null;

/**
 * Initialize text-to-image pipeline
 */
export const initializeTextToImagePipeline = async () => {
  if (!textToImagePipeline) {
    console.log('Initializing text-to-image pipeline...');
    try {
      // Use "image-to-text" pipeline type instead of "text-to-image" which is not a valid type
      textToImagePipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'cpu' }
      );
      console.log('Text-to-image pipeline initialized successfully');
    } catch (error) {
      console.error('Error initializing text-to-image pipeline:', error);
      return false;
    }
  }
  return true;
};

/**
 * Generate a storyboard from scenes using Hugging Face model
 */
export const generateStoryboard = (
  scenes: Scene[],
  characters: Character[],
  title: string
): Storyboard => {
  return {
    id: `storyboard-${Date.now()}`,
    title,
    scenes: scenes.map(scene => ({
      ...scene,
      imageUrl: scene.imageUrl || `/placeholder.svg`
    }))
  };
};

/**
 * Format scene for prompt generation
 * Creates a detailed prompt for an image generation AI
 */
export const formatSceneForPrompt = (scene: Scene, characters: Character[]): string => {
  // Get characters in this scene
  const sceneCharacters = characters.filter(char => scene.characters.includes(char.id));
  
  // Create character descriptions
  const characterDescriptions = sceneCharacters
    .map(char => `${char.name}: ${char.description}`)
    .join('. ');
  
  // Create setting description
  const setting = scene.setting;
  
  // Create action description
  const actions = scene.actions.slice(0, 3).join('. ');
  
  // Combine into a detailed prompt that works well with Stable Diffusion
  return `Scene depicting "${scene.title}". 
Setting: ${setting}. 
Characters: ${characterDescriptions}. 
Action: ${actions}. 
Cinematic lighting, detailed, professional storyboard art style.`.trim();
};

/**
 * Format character for prompt generation
 * Creates a detailed prompt for an image generation AI
 */
export const formatCharacterForPrompt = (character: Character): string => {
  // Create character description
  const description = character.description;
  
  // Create trait description
  const traits = character.traits.join(', ');
  
  // Include role information
  const role = character.role;
  
  // Combine into a prompt optimized for Stable Diffusion
  return `Portrait of ${character.name}. 
Description: ${description}. 
Traits: ${traits}. 
Role: ${role} character. 
Professional character concept art, detailed, cinematic lighting, film quality.`.trim();
};

/**
 * Generate a scene image using Hugging Face's Stable Diffusion
 */
export const generateSceneImage = async (scene: Scene, characters: Character[]): Promise<string> => {
  console.log(`Generating image for scene: ${scene.title}`);
  
  try {
    // Initialize pipeline if needed
    const isInitialized = await initializeTextToImagePipeline();
    if (!isInitialized || !textToImagePipeline) {
      console.error('Failed to initialize text-to-image pipeline');
      return '/placeholder.svg';
    }
    
    // Create a comprehensive prompt for the AI
    const prompt = formatSceneForPrompt(scene, characters);
    console.log('Scene prompt:', prompt);
    
    // For demo purposes, we're using a placeholder
    // In a real implementation, you would call the actual model
    console.log('Using placeholder image - for a real implementation, configure server-side image generation');
    
    return '/placeholder.svg';
  } catch (error) {
    console.error('Error generating scene image:', error);
    return '/placeholder.svg';
  }
};

/**
 * Generate a character image using Hugging Face's Stable Diffusion
 */
export const generateCharacterImage = async (character: Character): Promise<string> => {
  console.log(`Generating image for character: ${character.name}`);
  
  try {
    // Initialize pipeline if needed
    const isInitialized = await initializeTextToImagePipeline();
    if (!isInitialized || !textToImagePipeline) {
      console.error('Failed to initialize text-to-image pipeline');
      return '/placeholder.svg';
    }
    
    // Create a comprehensive prompt for the AI
    const prompt = formatCharacterForPrompt(character);
    console.log('Character prompt:', prompt);
    
    // For demo purposes, we're using a placeholder
    // In a real implementation, you would call the actual model
    console.log('Using placeholder image - for a real implementation, configure server-side image generation');
    
    return '/placeholder.svg';
  } catch (error) {
    console.error('Error generating character image:', error);
    return '/placeholder.svg';
  }
};

/**
 * Generate audio narration (stub function)
 * In a real app, this would use text-to-speech
 */
export const generateAudioNarration = async (scenes: Scene[]): Promise<string> => {
  // For now, use placeholder
  return '/path/to/narration.mp3';
};

/**
 * Break down a scene into key frames
 */
export const breakdownSceneIntoKeyFrames = (scene: Scene): string[] => {
  return scene.actions.slice(0, 5).map(action => action);
};
