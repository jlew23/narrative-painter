import { Character, CharacterRole, Scene, ScriptAnalysisResult } from './types';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let textClassificationPipeline: any = null;

/**
 * Initialize the NLP pipeline for text classification
 */
export const initializeNLPPipeline = async () => {
  try {
    console.log('Initializing NLP pipeline...');
    if (!textClassificationPipeline) {
      textClassificationPipeline = await pipeline(
        'text-classification', 
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' }
      );
      console.log('NLP pipeline initialized successfully');
    }
    return textClassificationPipeline;
  } catch (error) {
    console.error('Error initializing NLP pipeline:', error);
    return null;
  }
};

/**
 * Extract characters from a script using regex and context analysis
 */
export const extractCharactersFromScript = (scriptText: string): Character[] => {
  console.log('Extracting characters from script...');
  
  // Improved regex to find potential character names (ALL CAPS lines followed by dialogue)
  const characterNameRegex = /^([A-Z][A-Z\s]+)(?:\s*\([^)]*\))?\s*$/gm;
  const characterMatches = [...scriptText.matchAll(characterNameRegex)];
  
  // Get unique character names
  const characterNames = [...new Set(characterMatches.map(match => match[1].trim()))];
  console.log('Found potential character names:', characterNames);
  
  // Create basic character objects
  return characterNames.map((name, index) => {
    // Find potential description from context
    const description = findCharacterDescription(scriptText, name);
    const role = determineCharacterRole(scriptText, name);
    const traits = extractCharacterTraits(scriptText, name);
    
    console.log(`Character "${name}" extracted with role "${role}"`);
    
    return {
      id: `character-${index}`,
      name,
      description: description || `Character ${name} with no description available`,
      role,
      traits,
      generationStatus: 'pending'
    };
  });
};

/**
 * Simple scene extraction from script
 */
export const extractScenesFromScript = (scriptText: string, characters: Character[]): Scene[] => {
  console.log('Extracting scenes from script...');
  
  // Improved regex to find scene headings (INT./EXT. followed by location)
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|INTERIOR|EXTERIOR)\s(.+?)(?:\s*-\s*(.+?))?$/gim;
  const sceneMatches = [...scriptText.matchAll(sceneHeadingRegex)];
  
  console.log(`Found ${sceneMatches.length} potential scenes`);
  
  return sceneMatches.map((match, index) => {
    const interior = match[1];
    const location = match[2];
    const timeOfDay = match[3] || '';
    
    // Get text until next scene heading or end of script
    const nextMatchIndex = sceneMatches[index + 1] ? scriptText.indexOf(sceneMatches[index + 1][0], match.index!) : scriptText.length;
    const sceneText = scriptText.substring(match.index!, nextMatchIndex).trim();
    
    // Find characters in this scene
    const charactersInScene = characters.filter(char => 
      sceneText.includes(char.name)
    );
    
    // Extract actions (simple approach - paragraphs that aren't dialogue)
    const actions = extractActionsFromScene(sceneText);
    
    const sceneTitle = `${interior} ${location}`.trim();
    console.log(`Extracted scene: ${sceneTitle}`);
    
    return {
      id: `scene-${index}`,
      title: sceneTitle,
      description: `${interior} ${location} ${timeOfDay}`.trim(),
      characters: charactersInScene.map(char => char.id),
      actions,
      setting: `${location} ${timeOfDay}`.trim(),
      generationStatus: 'pending'
    };
  });
};

/**
 * Extract character traits from context
 */
const extractCharacterTraits = (scriptText: string, characterName: string): string[] => {
  // In a real app, this would use NLP or AI to extract traits
  // Simplified implementation for demo purposes
  const traits: string[] = [];
  
  const descriptiveTerms = [
    'young', 'old', 'tall', 'short', 'thin', 'heavy', 'beautiful', 'handsome', 
    'rugged', 'elegant', 'nervous', 'confident', 'shy', 'outgoing', 'intelligent', 
    'simple', 'complex', 'mysterious', 'open', 'dark', 'light', 'blonde', 'brunette',
    'redhead', 'strong', 'weak', 'determined', 'hesitant', 'brave', 'cowardly'
  ];
  
  // Check for common descriptive terms near character name
  const snippets = findContextualSnippets(scriptText, characterName, 50);
  
  descriptiveTerms.forEach(term => {
    if (snippets.some(snippet => snippet.toLowerCase().includes(term))) {
      traits.push(term);
    }
  });
  
  // If no traits found, add some defaults based on role
  if (traits.length === 0) {
    traits.push('neutral', 'average');
  }
  
  return traits;
};

/**
 * Find potential character description from script context
 */
const findCharacterDescription = (scriptText: string, characterName: string): string => {
  // In a real app, this would use more sophisticated NLP
  // Simple implementation for demo purposes
  
  // Look for character name followed by a description (e.g., "JOHN, a 30-year-old detective")
  const descriptionRegex = new RegExp(`${characterName}\\s*,\\s*([^\\n.]+)[\\n.]`, 'i');
  const match = scriptText.match(descriptionRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Fallback to looking for descriptions near the character name
  const snippets = findContextualSnippets(scriptText, characterName, 100);
  
  // Join snippets that might contain description
  return snippets.join(' ').substring(0, 150) || 'No description available';
};

/**
 * Find text snippets around a character name for context
 */
const findContextualSnippets = (scriptText: string, characterName: string, radius: number): string[] => {
  const snippets: string[] = [];
  let lastIndex = 0;
  
  while (lastIndex < scriptText.length) {
    const index = scriptText.indexOf(characterName, lastIndex);
    if (index === -1) break;
    
    const start = Math.max(0, index - radius);
    const end = Math.min(scriptText.length, index + characterName.length + radius);
    
    snippets.push(scriptText.substring(start, end));
    lastIndex = index + 1;
  }
  
  return snippets;
};

/**
 * Determine character role based on script analysis
 */
const determineCharacterRole = (scriptText: string, characterName: string): CharacterRole => {
  // Count character mentions as a basic metric
  const nameRegex = new RegExp(`\\b${characterName}\\b`, 'g');
  const nameMatches = scriptText.match(nameRegex);
  const mentionCount = nameMatches ? nameMatches.length : 0;
  
  // Check if name appears in first 20% of script (potential protagonist)
  const firstFifth = scriptText.substring(0, Math.floor(scriptText.length * 0.2));
  const appearsEarly = firstFifth.includes(characterName);
  
  if (mentionCount > 20 && appearsEarly) {
    return 'protagonist';
  } else if (mentionCount > 15) {
    // Check for antagonist keywords near character
    const snippets = findContextualSnippets(scriptText, characterName, 50);
    const antagonistTerms = ['oppose', 'against', 'enemy', 'villain', 'evil', 'fight', 'conflict'];
    
    if (snippets.some(snippet => 
      antagonistTerms.some(term => snippet.toLowerCase().includes(term))
    )) {
      return 'antagonist';
    }
    
    return 'supporting';
  } else if (mentionCount > 5) {
    return 'supporting';
  } else {
    return 'minor';
  }
};

/**
 * Extract actions from scene text
 */
const extractActionsFromScene = (sceneText: string): string[] => {
  // Remove dialogue (simplistic approach)
  const lines = sceneText.split('\n');
  const actions: string[] = [];
  
  let inDialogue = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check for character name (ALL CAPS)
    if (/^[A-Z][A-Z\s]+$/.test(line)) {
      inDialogue = true;
      continue;
    }
    
    // Check for parenthetical
    if (/^\(.*\)$/.test(line)) {
      continue;
    }
    
    // If we're not in dialogue and it's not a scene heading, it's likely an action
    if (!inDialogue && !line.startsWith('INT.') && !line.startsWith('EXT.') && !line.startsWith('INT/EXT.')) {
      actions.push(line);
    }
    
    // Exit dialogue mode after a blank line
    if (inDialogue && !lines[i+1]?.trim()) {
      inDialogue = false;
    }
  }
  
  return actions;
};

/**
 * Main function to analyze a script using NLP and regex
 */
export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysisResult> => {
  console.log('Starting script analysis...');
  
  // Extract title (first line often)
  const lines = scriptText.split('\n');
  const potentialTitle = lines.find(line => 
    line.trim().length > 0 && 
    line.toUpperCase() === line.trim() && 
    !line.includes('INT.') && 
    !line.includes('EXT.')
  )?.trim() || 'Untitled Script';
  
  // Extract characters
  const characters = extractCharactersFromScript(scriptText);
  
  if (characters.length === 0) {
    console.warn('No characters found in script - using fallback method');
    // Fallback: Try to identify names in the text using NLP
    const nameMatches = findPotentialNames(scriptText);
    for (let i = 0; i < nameMatches.length && i < 5; i++) {
      characters.push({
        id: `character-fallback-${i}`,
        name: nameMatches[i],
        description: `Character identified in script`,
        role: i === 0 ? 'protagonist' : i === 1 ? 'antagonist' : 'supporting',
        traits: ['identified', 'character'],
        generationStatus: 'pending'
      });
    }
  }
  
  // Extract scenes
  const scenes = extractScenesFromScript(scriptText, characters);
  
  if (scenes.length === 0) {
    console.warn('No scenes found in script - creating default scene');
    // Create at least one scene if none were found
    scenes.push({
      id: 'scene-default',
      title: 'Default Scene',
      description: 'A scene from the script',
      characters: characters.map(char => char.id),
      actions: ['Characters interact in this scene'],
      setting: 'Default setting',
      generationStatus: 'pending'
    });
  }
  
  // Generate a summary using the first few paragraphs
  const summary = scriptText.substring(0, 300) + '...';
  
  console.log(`Analysis complete: ${characters.length} characters, ${scenes.length} scenes`);
  
  return {
    title: potentialTitle,
    summary,
    characters,
    scenes
  };
};

/**
 * Fallback method to find potential character names in text
 * Used when the regex approach fails to find characters
 */
const findPotentialNames = (text: string): string[] => {
  // Look for capitalized words that might be names
  const potentialNames = new Set<string>();
  
  // Simple regex for capitalized words that might be names
  const nameRegex = /\b[A-Z][a-z]{2,}\b/g;
  const matches = [...text.matchAll(nameRegex)];
  
  matches.forEach(match => {
    const name = match[0];
    // Filter out common non-name capitalized words
    if (!['INT', 'EXT', 'THE', 'AND', 'FADE', 'CUT', 'TO', 'SCENE'].includes(name)) {
      potentialNames.add(name);
    }
  });
  
  return [...potentialNames];
};
