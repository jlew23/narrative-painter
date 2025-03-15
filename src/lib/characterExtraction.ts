
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
 * 
 * Improved to better detect actual character names rather than random capitalized words
 */
export const extractCharactersFromScript = (scriptText: string): Character[] => {
  console.log('Extracting characters from script...');
  
  // Improved regex to find character names (ALL CAPS followed by dialogue)
  // This specifically looks for the screenplay format where character names appear before dialogue
  const characterDialoguePattern = /^([A-Z][A-Z\s'-]+)(?:\s*\([^)]*\))?\s*\n([\s\S]*?)(?=\n\s*\n|\n[A-Z][A-Z\s'-]+|\n$)/gm;
  const dialogueMatches = [...scriptText.matchAll(characterDialoguePattern)];
  
  // Also look for character introductions (NAME, description)
  const characterIntroPattern = /\b([A-Z][A-Z\s'-]+)(?:,\s+(?:a|an|the)\s+[^,.]*)/gm;
  const introMatches = [...scriptText.matchAll(characterIntroPattern)];
  
  // Get unique character names from both patterns
  const characterNames = new Set([
    ...dialogueMatches.map(match => match[1].trim()),
    ...introMatches.map(match => match[1].trim())
  ]);
  
  // Filter out common script elements that aren't character names
  const filteredNames = [...characterNames].filter(name => {
    // Skip common screenplay headings and transitions
    const nonCharacterTerms = [
      'INT', 'EXT', 'INT./EXT', 'EXT./INT',
      'FADE IN', 'FADE OUT', 'CUT TO', 'DISSOLVE TO',
      'SMASH CUT', 'MATCH CUT', 'JUMP CUT', 'TITLE',
      'SUPER', 'END CREDITS', 'MONTAGE', 'INTERCUT',
      'ANGLE ON', 'CLOSE ON', 'SCENE', 'THE END',
      'FLASHBACK', 'BACK TO', 'CONTINUED', 'LATER',
      'MOMENTS LATER', 'NIGHT', 'DAY', 'EVENING', 'MORNING',
      'SAME TIME', 'SUBTITLE', 'TITLE CARD', 'AT THE SAME TIME',
      'SERIES OF SHOTS', 'SFX', 'POV', 'V.O.', 'O.S.', 'O.C.',
      'EPISODE', 'CHAPTER', 'ACT'
    ];
    
    // Added more terms that aren't character names including pronouns and store names
    const commonPronouns = [
      'HE', 'SHE', 'THEY', 'IT', 'WE', 'YOU', 'I', 'ME', 'MY', 'MINE', 
      'HIS', 'HER', 'HERS', 'THEM', 'THEIR', 'THEIRS', 'OUR', 'OURS', 'YOUR', 'YOURS',
      'HIMSELF', 'HERSELF', 'THEMSELVES', 'MYSELF', 'YOURSELF', 'YOURSELVES', 'OURSELVES',
      'THIS', 'THAT', 'THESE', 'THOSE'
    ];
    
    // List of common store/business/location names that might appear in ALL CAPS
    const businessNames = [
      'BIG BUY', 'WALMART', 'TARGET', 'STARBUCKS', 'MCDONALDS', 'MALL', 'CINEMA',
      'THEATER', 'COFFEE SHOP', 'DINER', 'RESTAURANT', 'SHOP', 'STORE', 'MARKET',
      'SUPERMARKET', 'PHARMACY', 'HOSPITAL', 'SCHOOL', 'UNIVERSITY', 'COLLEGE',
      'LIBRARY', 'BANK', 'POLICE STATION', 'FIRE STATION', 'GAS STATION'
    ];
    
    // Filter out common non-character terms
    for (const term of [...nonCharacterTerms, ...commonPronouns, ...businessNames]) {
      if (name === term || name.includes(term + ' ') || name.includes(' ' + term)) {
        return false;
      }
    }
    
    // Check for typically single-word location names
    if (name.split(' ').length === 1 && ['ROOM', 'OFFICE', 'STREET', 'PARK', 'HOUSE', 'APARTMENT'].includes(name)) {
      return false;
    }
    
    // Exclude names that are too short (likely abbreviations or single words)
    if (name.length < 3) {
      return false;
    }
    
    // Check if the name appears standalone multiple times (like an actual character)
    const nameRegex = new RegExp(`^${name}\\b`, 'gm');
    const exactMatches = scriptText.match(nameRegex);
    
    // If it doesn't appear multiple times as an exact match at the start of lines,
    // it's probably not a character name in screenplay format
    if (!exactMatches || exactMatches.length < 2) {
      return false;
    }
    
    // Additional check: when the name appears, is it followed by dialogue?
    // This helps filter out section headers or other ALL CAPS elements
    const nameWithDialogueCount = (scriptText.match(new RegExp(`^${name}\\s*\\n(?!\\s*[A-Z][A-Z\\s]+)`, 'gm')) || []).length;
    
    // If at least some occurrences are followed by dialogue, it's likely a character
    return nameWithDialogueCount > 0;
  });
  
  console.log('Found potential character names:', filteredNames);
  
  // Create basic character objects
  return filteredNames.map((name, index) => {
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
    // Fallback: Use improved character detection
    const nameMatches = findPotentialCharacterNames(scriptText);
    
    // Additional filtering to remove non-character names
    const filteredFallbackNames = nameMatches.filter(name => {
      const commonNonNames = ['SHE', 'HE', 'THEY', 'BIG BUY', 'WALL', 'DOOR', 'TABLE'];
      return !commonNonNames.includes(name.toUpperCase());
    });
    
    for (let i = 0; i < filteredFallbackNames.length && i < 5; i++) {
      characters.push({
        id: `character-fallback-${i}`,
        name: filteredFallbackNames[i],
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
 * Improved fallback method to find potential character names in text
 * Used when the regex approach fails to find characters
 */
const findPotentialCharacterNames = (text: string): string[] => {
  // Look for proper names that appear multiple times in dialogue context
  const potentialNames = new Map<string, number>();
  
  // First pass: look for capitalized words that might be names, 
  // but specifically in contexts where they're likely to be character names
  
  // Look for "NAME:" or "NAME says" patterns (common in some script formats)
  const nameColonPattern = /\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\s*[:]/g;
  const nameSaysPattern = /\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\s+(?:says|said|asks|asked|replied|responds|shouted|whispered)/gi;
  
  // Collect matches from both patterns
  const colonMatches = [...text.matchAll(nameColonPattern)];
  const saysMatches = [...text.matchAll(nameSaysPattern)];
  
  // Count occurrences of each potential name
  colonMatches.forEach(match => {
    const name = match[1];
    potentialNames.set(name, (potentialNames.get(name) || 0) + 2); // Higher weight for NAME: pattern
  });
  
  saysMatches.forEach(match => {
    const name = match[1];
    potentialNames.set(name, (potentialNames.get(name) || 0) + 1);
  });
  
  // Also check for names in quotes or speaking context
  const quotePattern = /"([^"]+)"/g;
  let quoteMatch;
  while ((quoteMatch = quotePattern.exec(text)) !== null) {
    // Look for a name before the quote (e.g., "John said, "Hello"")
    const precedingText = text.substring(Math.max(0, quoteMatch.index - 30), quoteMatch.index);
    const nameBeforeQuote = /([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\s+(?:said|says|asked|asks|replied|responds|shouted|whispered|exclaimed|muttered)/.exec(precedingText);
    
    if (nameBeforeQuote) {
      const name = nameBeforeQuote[1];
      potentialNames.set(name, (potentialNames.get(name) || 0) + 1);
    }
  }
  
  // Filter and sort potential names by frequency
  const filteredNames = [...potentialNames.entries()]
    .filter(([name, count]) => {
      // Filter out common non-name capitalized words and ensure more than one occurrence
      const nonNameWords = [
        'The', 'This', 'That', 'These', 'Those', 'There', 'They', 'Their', 'And', 'But',
        'However', 'Then', 'When', 'Where', 'What', 'Who', 'Why', 'How', 'Which', 'While',
        'Although', 'Because', 'Since', 'After', 'Before', 'During', 'Through', 'Throughout',
        'Some', 'Any', 'Many', 'Much', 'Most', 'More', 'Less', 'Few', 'Little', 'All',
        'Every', 'Each', 'Either', 'Neither', 'Both', 'Such', 'Rather', 'Quite', 'Very',
        'She', 'He', 'It', 'We', 'You', 'I', 'Me', 'My', 'Mine', 'His', 'Her', 'Hers',
        'Them', 'Their', 'Our', 'Your', 'Yours', 'Big', 'Buy', 'Big Buy', 'Store', 'Shop'
      ];
      
      return !nonNameWords.includes(name) && count > 1;
    })
    .sort((a, b) => b[1] - a[1]) // Sort by frequency (highest first)
    .map(([name]) => name);
  
  return filteredNames;
};
