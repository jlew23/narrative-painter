
// Import the types from the new location
import { Character, CharacterRole, Scene, ScriptAnalysisResult } from './types';

/**
 * Analyzes a script to extract characters, scenes, and a summary.
 */
export const analyzeScript = (script: string): ScriptAnalysisResult => {
  // Extract title
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
