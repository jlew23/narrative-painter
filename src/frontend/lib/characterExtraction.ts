
import { Character, CharacterRole, Scene, ScriptAnalysisResult } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize the NLP pipeline for character extraction
 */
export const initializeNLPPipeline = async (): Promise<boolean> => {
  // In the frontend, this is just a mock function that simulates pipeline loading
  console.log("Initializing frontend NLP pipeline for character extraction");
  
  // Simulate a delay for initialization
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
};

/**
 * Analyzes a script to extract characters, scenes, and a summary.
 * This is a frontend version that would call the backend in a real app
 */
export const analyzeScript = async (script: string): Promise<ScriptAnalysisResult> => {
  console.log("Analyzing script in frontend...");
  
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Extract title (basic frontend implementation)
  const title = extractTitle(script);

  // Extract summary
  const summary = extractSummary(script);

  // Extract characters
  const characters = extractCharacters(script);

  // Extract scenes
  const scenes = extractScenes(script, characters);

  return {
    characters,
    scenes,
    title,
    summary,
  };
};

/**
 * Extracts the title from the script.
 */
const extractTitle = (script: string): string => {
  const titleRegex = /Title:\s*(.*)/i;
  const match = script.match(titleRegex);
  return match ? match[1].trim() : 'Untitled';
};

/**
 * Extracts a summary from the script.
 */
const extractSummary = (script: string): string => {
  const summaryRegex = /Summary:\s*(.*)/i;
  const match = script.match(summaryRegex);
  return match ? match[1].trim() : 'No summary provided.';
};

/**
 * Extracts characters from the script.
 */
const extractCharacters = (script: string): Character[] => {
  const characterRegex = /Character:\s*(.*)\nDescription:\s*(.*)\nRole:\s*(.*)\nTraits:\s*(.*)/gi;
  let match;
  const characters: Character[] = [];

  while ((match = characterRegex.exec(script)) !== null) {
    const [, name, description, role, traits] = match;
    const id = `character-${characters.length + 1}`;

    characters.push({
      id,
      name: name.trim(),
      description: description.trim(),
      role: (role.trim() as CharacterRole),
      traits: traits.split(',').map(trait => trait.trim()),
      generationStatus: 'pending',
    });
  }

  return characters;
};

/**
 * Adds a new character with the given name and role
 */
export const addNamedCharacter = (
  name: string, 
  role: CharacterRole, 
  existingCharacters: Character[]
): Character => {
  return {
    id: `char-${uuidv4().slice(0, 8)}`,
    name,
    description: `A ${role} character named ${name}`,
    role,
    traits: [],
    generationStatus: 'pending'
  };
};

/**
 * Extracts scenes from the script and associates characters with them.
 */
const extractScenes = (script: string, characters: Character[]): Scene[] => {
  const sceneRegex = /Scene:\s*(.*)\nSetting:\s*(.*)\nCharacters:\s*(.*)\n(.*?)(?=(Scene:|$))/gi;
  let match;
  const scenes: Scene[] = [];

  while ((match = sceneRegex.exec(script)) !== null) {
    const [, title, setting, characterNames, sceneText] = match;
    const id = `scene-${scenes.length + 1}`;

    // Extract actions from the scene text
    const actions = extractActionsFromScene(sceneText);

    // Map character names to character IDs
    const characterIds = characterNames
      .split(',')
      .map(name => name.trim())
      .map(name => characters.find(char => char.name === name)?.id)
      .filter(id => id !== undefined) as string[];

    scenes.push({
      id,
      title: title.trim(),
      description: '', // You might want to extract a description from the sceneText
      characters: characterIds,
      actions: actions,
      setting: setting.trim(),
      imageUrl: '',
      generationStatus: 'pending',
    });
  }

  return scenes;
};

/**
 * Helper function to extract actions from a scene 
 */
export const extractActionsFromScene = (sceneText: string): string[] => {
  const actions: string[] = [];
  
  // Simple action extraction - find sentences describing actions
  const sentences = sceneText.split(/[.!?]/).filter(Boolean).map(s => s.trim());
  
  // Filter to likely action sentences (non-dialogue, descriptive)
  for (const sentence of sentences) {
    // Skip obvious dialogue lines
    if (sentence.includes('"') || /^[A-Z]+:/.test(sentence)) {
      continue;
    }
    
    // Focus on sentences with verbs indicating action
    if (/\b(walks?|runs?|moves?|opens?|closes?|sits?|stands?|looks?|turns?|puts?|picks?|grabs?|pulls?|pushes?)\b/i.test(sentence)) {
      actions.push(sentence);
    }
  }
  
  return actions.slice(0, 10); // Limit to 10 actions per scene
};
