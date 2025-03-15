
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
 * Extract characters from text - handles both screenplay format and regular stories
 */
export const extractCharactersFromScript = (scriptText: string): Character[] => {
  console.log('Extracting characters from text...');
  
  // Try screenplay format first (ALL CAPS followed by dialogue)
  const characterDialoguePattern = /^([A-Z][A-Z\s'-]+)(?:\s*\([^)]*\))?\s*\n([\s\S]*?)(?=\n\s*\n|\n[A-Z][A-Z\s'-]+|\n$)/gm;
  const dialogueMatches = [...scriptText.matchAll(characterDialoguePattern)];
  
  // Also look for character introductions (NAME, description)
  const characterIntroPattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)(?:,\s+(?:a|an|the|who|is)\s+[^,.]*)/gm;
  const introMatches = [...scriptText.matchAll(characterIntroPattern)];
  
  // For regular stories, look for proper nouns that appear frequently
  // This pattern looks for capitalized words that aren't at the start of sentences
  const properNounPattern = /(?<![.!?]\s)(?<!\n)(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b)/g;
  const properNouns = [...scriptText.matchAll(properNounPattern)];
  
  // Also look for quotes with attribution, like: "Hello," said John.
  const quotePattern = /"[^"]+"\s*(?:,)?\s*(?:said|asked|replied|whispered|shouted|exclaimed|called|responded)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g;
  const quoteMatches = [...scriptText.matchAll(quotePattern)];
  
  // Collect potential names from all methods
  const potentialNames = new Map<string, number>();
  
  // Add names from screenplay format with high weight
  dialogueMatches.forEach(match => {
    const name = match[1].trim();
    potentialNames.set(name, (potentialNames.get(name) || 0) + 5);
  });
  
  // Add names from character introductions with high weight
  introMatches.forEach(match => {
    const name = match[1].trim();
    potentialNames.set(name, (potentialNames.get(name) || 0) + 3);
  });
  
  // Add names from quotes with medium weight
  quoteMatches.forEach(match => {
    const name = match[1].trim();
    potentialNames.set(name, (potentialNames.get(name) || 0) + 2);
  });
  
  // Add proper nouns with lower weight
  properNouns.forEach(match => {
    const name = match[1].trim();
    potentialNames.set(name, (potentialNames.get(name) || 0) + 1);
  });
  
  // Filter and sort potential names
  const sortedNames = [...potentialNames.entries()]
    .filter(([name, count]) => {
      // Must occur at least twice
      if (count < 2) return false;
      
      // Skip common non-character terms
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
      
      // Skip pronouns and common terms
      const commonPronouns = [
        'HE', 'SHE', 'THEY', 'IT', 'WE', 'YOU', 'I', 'ME', 'MY', 'MINE', 
        'HIS', 'HER', 'HERS', 'THEM', 'THEIR', 'THEIRS', 'OUR', 'OURS', 'YOUR', 'YOURS',
        'HIMSELF', 'HERSELF', 'THEMSELVES', 'MYSELF', 'YOURSELF', 'YOURSELVES', 'OURSELVES',
        'THIS', 'THAT', 'THESE', 'THOSE', 'He', 'She', 'They', 'It', 'We', 'You', 'I'
      ];
      
      // Skip business and location names
      const businessNames = [
        'BIG BUY', 'WALMART', 'TARGET', 'STARBUCKS', 'MCDONALDS', 'MALL', 'CINEMA',
        'THEATER', 'COFFEE SHOP', 'DINER', 'RESTAURANT', 'SHOP', 'STORE', 'MARKET',
        'SUPERMARKET', 'PHARMACY', 'HOSPITAL', 'SCHOOL', 'UNIVERSITY', 'COLLEGE',
        'LIBRARY', 'BANK', 'POLICE STATION', 'FIRE STATION', 'GAS STATION'
      ];
      
      // Skip months, days, and time-related terms
      const timeTerms = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
        'September', 'October', 'November', 'December', 'Monday', 'Tuesday', 
        'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Today', 'Tomorrow', 
        'Yesterday', 'Morning', 'Afternoon', 'Evening', 'Night'
      ];
      
      // Skip common titles
      const titles = [
        'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sir', 'Lady', 'Lord', 'Captain', 
        'Lieutenant', 'Sergeant', 'Officer', 'Detective', 'Judge', 'President'
      ];
      
      // Check against all exclusion lists
      for (const term of [...nonCharacterTerms, ...commonPronouns, ...businessNames, ...timeTerms]) {
        if (name === term || name.includes(term + ' ') || name.includes(' ' + term)) {
          return false;
        }
      }
      
      // Filter out titles when they appear alone
      if (titles.includes(name)) {
        return false;
      }
      
      // Skip single letter words
      if (name.length <= 1) {
        return false;
      }
      
      // Skip if name is all uppercase (likely a header)
      if (name === name.toUpperCase() && name.length > 3) {
        // Check if it's used in dialogue context
        const nameRegex = new RegExp(`"[^"]+"\s*(?:,)?\s*(?:said|asked|replied)\s+${name}\\b`, 'i');
        if (!scriptText.match(nameRegex)) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => b[1] - a[1]); // Sort by frequency (highest first)
  
  console.log('Found potential character names:', sortedNames.map(n => n[0]));
  
  // Take the top names (up to 10)
  const filteredNames = sortedNames.slice(0, 10).map(([name]) => name);
  
  // Create character objects
  return filteredNames.map((name, index) => {
    // Find potential description
    const description = findCharacterDescription(scriptText, name) || generateCharacterDescription(name);
    const role = determineCharacterRole(scriptText, name, index);
    const traits = extractCharacterTraits(scriptText, name);
    
    // Map each character to a pre-loaded image
    const sampleCharacterImages = [
      'public/lovable-uploads/d92d25df-8a20-4388-a978-6f26545f45a5.png',
      'public/lovable-uploads/a74dd3a1-8f81-426e-9dfd-ddacc2669762.png',
      'public/lovable-uploads/0f25fd33-4d81-4901-bf39-775060e2a0b9.png',
      'public/lovable-uploads/d1b481b4-fdd4-435d-a01c-9f863e3e1def.png',
      'public/lovable-uploads/3ae6df30-6eac-4604-81f4-2ace0197eda0.png',
      'public/lovable-uploads/eb922982-c40b-482f-975a-12cb014bb79c.png',
      'public/lovable-uploads/952c11d0-ee84-493e-ba6a-9d568470e138.png',
      'public/lovable-uploads/2acfc657-5e91-48ad-904f-bc4ba5dd0bba.png',
      'public/lovable-uploads/257a14ff-d8b2-449b-9714-2adf734dea5e.png',
      'public/lovable-uploads/7d748bce-f662-452b-8c5a-7cacb3c1bffc.png',
      'public/lovable-uploads/9bf47792-550a-4844-bd52-4026d2891a7e.png',
      'public/lovable-uploads/ba09d797-4d1f-4a4f-9260-bce9a87cf234.png',
      'public/lovable-uploads/c4db05fa-63e4-428c-8270-803dae0b16f0.png',
      'public/lovable-uploads/c7eb719e-cc7c-4ab0-a119-3f06e4f76fef.png',
      'public/lovable-uploads/3e8c0049-3cd4-4dac-bcd7-b6291c5a0366.png',
      'public/lovable-uploads/2141f123-2016-4e63-a2d2-a922280a7fbb.png',
      'public/lovable-uploads/2a2b23ad-1f40-4bf5-80a0-b09cf1a73e32.png',
      'public/lovable-uploads/3aa9d41e-8c0c-43e9-94f1-de59a4e04baa.png',
      'public/lovable-uploads/4b00c6fd-c0bd-45e2-a1bf-72b7c06776f0.png',
      'public/lovable-uploads/5ec78f1a-f8a6-4e6e-b529-e92e685abd6a.png'
    ];
    
    // Get an image for this character (cycle through the available images)
    const imageUrl = sampleCharacterImages[index % sampleCharacterImages.length];
    
    console.log(`Character "${name}" extracted with role "${role}"`);
    
    return {
      id: `character-${index}`,
      name,
      description,
      role,
      traits,
      imageUrl,
      generationStatus: 'completed' as const  // Mark as completed since we're using sample images
    };
  });
};

/**
 * Generate a description if none is found
 */
const generateCharacterDescription = (name: string): string => {
  const descriptions = [
    `A mysterious character who plays an important role in the story`,
    `A character with a complex personality and interesting background`,
    `An intriguing character that appears throughout the narrative`,
    `A memorable character with unique traits and characteristics`,
    `A character whose actions significantly impact the story`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

/**
 * Simple scene extraction from script
 */
export const extractScenesFromScript = (scriptText: string, characters: Character[]): Scene[] => {
  console.log('Extracting scenes from script...');
  
  let scenes: Scene[] = [];
  
  // Try screenplay format first (INT./EXT. followed by location)
  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|INTERIOR|EXTERIOR)\s(.+?)(?:\s*-\s*(.+?))?$/gim;
  const sceneMatches = [...scriptText.matchAll(sceneHeadingRegex)];
  
  if (sceneMatches.length > 0) {
    console.log(`Found ${sceneMatches.length} potential scenes in screenplay format`);
    
    scenes = sceneMatches.map((match, index) => {
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
      
      // Extract actions
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
  } else {
    // For regular stories, split by paragraphs or sections
    console.log('No screenplay format scenes found, extracting from regular story format');
    
    // Split by large paragraph breaks or chapter indicators
    const chapterRegex = /\n\s*(?:CHAPTER|Chapter)\s+(?:[A-Z0-9]+|[0-9]+|\w+)\s*\n|\n\s*\*\s*\*\s*\*\s*\n|\n\s*---\s*\n|\n\s*\*\*\*\s*\n|\n\s*#\s*\n/g;
    const chapters = scriptText.split(chapterRegex);
    
    if (chapters.length > 1) {
      // Use chapters as scenes
      scenes = chapters.map((chapterText, index) => {
        // Extract chapter title if available
        const titleMatch = chapterText.match(/^\s*(.+?)\n/);
        const title = titleMatch ? titleMatch[1].trim() : `Chapter ${index + 1}`;
        
        // Find characters in this chapter
        const charactersInScene = characters.filter(char => 
          chapterText.includes(char.name)
        );
        
        // Extract some text for actions
        const paragraphs = chapterText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const actions = paragraphs.slice(0, 3).map(p => p.trim());
        
        return {
          id: `scene-${index}`,
          title,
          description: paragraphs[0]?.trim().substring(0, 100) + '...' || title,
          characters: charactersInScene.map(char => char.id),
          actions,
          setting: `Scene from "${title}"`,
          generationStatus: 'pending'
        };
      });
    } else {
      // Split by paragraph clusters
      const paragraphs = scriptText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      // Group paragraphs into scenes (every 5 paragraphs)
      const paragraphGroups = [];
      for (let i = 0; i < paragraphs.length; i += 5) {
        paragraphGroups.push(paragraphs.slice(i, i + 5));
      }
      
      scenes = paragraphGroups.map((paragraphGroup, index) => {
        const sceneText = paragraphGroup.join('\n\n');
        
        // Find characters in this scene
        const charactersInScene = characters.filter(char => 
          sceneText.includes(char.name)
        );
        
        // Get location hints from the text
        const locationHints = findLocationHints(sceneText);
        
        return {
          id: `scene-${index}`,
          title: `Scene ${index + 1}${locationHints ? ': ' + locationHints : ''}`,
          description: paragraphGroup[0].trim().substring(0, 100) + '...',
          characters: charactersInScene.map(char => char.id),
          actions: paragraphGroup.map(p => p.trim()).slice(0, 3),
          setting: locationHints || 'Unspecified location',
          generationStatus: 'pending'
        };
      });
    }
  }
  
  console.log(`Extracted ${scenes.length} scenes from text`);
  return scenes;
};

/**
 * Try to find location hints in text
 */
const findLocationHints = (text: string): string => {
  // Look for location indicators
  const locationPatterns = [
    /at\s+the\s+([^,.]+)/i,
    /in\s+the\s+([^,.]+)/i,
    /at\s+([A-Z][a-z]+\'s)\s+([^,.]+)/i,
    /inside\s+the\s+([^,.]+)/i,
    /outside\s+the\s+([^,.]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
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
    traits.push('interesting', 'complex');
  }
  
  return traits;
};

/**
 * Find potential character description from script context
 */
const findCharacterDescription = (scriptText: string, characterName: string): string => {
  // Look for character name followed by a description (e.g., "JOHN, a 30-year-old detective")
  const descriptionRegex = new RegExp(`${characterName}(?:\\s*,\\s*|\\s+is\\s+|\\s+was\\s+)([^\\n.]+)[\\n.]`, 'i');
  const match = scriptText.match(descriptionRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Fallback to looking for descriptions near the character name
  const snippets = findContextualSnippets(scriptText, characterName, 100);
  
  // Look for descriptive phrases in snippets
  for (const snippet of snippets) {
    const descPhrases = [
      new RegExp(`${characterName}\\s+(?:is|was)\\s+([^.]+)`, 'i'),
      new RegExp(`${characterName}\\s*,\\s*([^.]+)`, 'i'),
      new RegExp(`(?:the|a|an)\\s+([\\w\\s-]+)\\s+${characterName}`, 'i')
    ];
    
    for (const phrase of descPhrases) {
      const phraseMatch = snippet.match(phrase);
      if (phraseMatch && phraseMatch[1] && phraseMatch[1].length > 10) {
        return phraseMatch[1].trim();
      }
    }
  }
  
  // Join snippets that might contain description
  return snippets.join(' ').substring(0, 150) || 'A character in the story';
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
const determineCharacterRole = (scriptText: string, characterName: string, index: number): CharacterRole => {
  // Count character mentions as a basic metric
  const nameRegex = new RegExp(`\\b${characterName}\\b`, 'g');
  const nameMatches = scriptText.match(nameRegex);
  const mentionCount = nameMatches ? nameMatches.length : 0;
  
  // Check if name appears in first 20% of script (potential protagonist)
  const firstFifth = scriptText.substring(0, Math.floor(scriptText.length * 0.2));
  const appearsEarly = firstFifth.includes(characterName);
  
  // For the first two characters, if we don't have other info, make them protagonist and antagonist
  if (index === 0 && appearsEarly) {
    return 'protagonist';
  } else if (index === 1) {
    // Check for antagonist keywords near character
    const snippets = findContextualSnippets(scriptText, characterName, 50);
    const antagonistTerms = ['oppose', 'against', 'enemy', 'villain', 'evil', 'fight', 'conflict'];
    
    if (snippets.some(snippet => 
      antagonistTerms.some(term => snippet.toLowerCase().includes(term))
    )) {
      return 'antagonist';
    }
    
    // If this character appears a lot but isn't clearly an antagonist, make them one anyway
    if (mentionCount > 10) {
      return 'antagonist';
    }
  }
  
  // Use mention count for other characters
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
  
  // Limit to a reasonable number of actions
  return actions.slice(0, 5);
};

/**
 * Main function to analyze a script using NLP and regex
 */
export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysisResult> => {
  console.log('Starting text analysis...');
  
  // Extract title (first line often, or check for a title pattern)
  const titleMatch = scriptText.match(/^(?:\s*)(?:TITLE:|Title:)?\s*([^\n]+)/i);
  const extractedTitle = titleMatch ? titleMatch[1].trim() : '';
  
  // Clean up the title
  const potentialTitle = extractedTitle || 'Untitled';
  
  // Extract characters first, so we can reference them in scenes
  const characters = extractCharactersFromScript(scriptText);
  
  console.log(`Extracted ${characters.length} characters`);
  
  // If no characters found, create placeholder characters using fallback method
  let finalCharacters = characters;
  
  if (characters.length === 0) {
    console.warn('No characters found in script - using fallback method');
    
    // Fallback: Create sample characters
    const sampleNames = ['Main Character', 'Antagonist', 'Supporting Character', 'Friend', 'Mentor'];
    const sampleRoles: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'supporting', 'supporting'];
    
    // Sample character images
    const sampleImages = [
      'public/lovable-uploads/d92d25df-8a20-4388-a978-6f26545f45a5.png',
      'public/lovable-uploads/a74dd3a1-8f81-426e-9dfd-ddacc2669762.png',
      'public/lovable-uploads/0f25fd33-4d81-4901-bf39-775060e2a0b9.png',
      'public/lovable-uploads/d1b481b4-fdd4-435d-a01c-9f863e3e1def.png',
      'public/lovable-uploads/3ae6df30-6eac-4604-81f4-2ace0197eda0.png'
    ];
    
    finalCharacters = sampleNames.map((name, i) => ({
      id: `character-fallback-${i}`,
      name,
      description: `Character found in the story`,
      role: sampleRoles[i],
      traits: ['character', i === 0 ? 'protagonist' : i === 1 ? 'antagonist' : 'supporting'],
      imageUrl: sampleImages[i],
      generationStatus: 'completed' as const
    }));
  }
  
  // Extract scenes
  const scenes = extractScenesFromScript(scriptText, finalCharacters);
  
  let finalScenes = scenes;
  
  if (scenes.length === 0) {
    console.warn('No scenes found in script - creating default scenes');
    // Create at least one scene if none were found
    finalScenes = [
      {
        id: 'scene-default-1',
        title: 'Opening Scene',
        description: 'The story begins',
        characters: finalCharacters.slice(0, 2).map(char => char.id),
        actions: ['Characters interact in this scene'],
        setting: 'Main location',
        generationStatus: 'pending'
      },
      {
        id: 'scene-default-2',
        title: 'Conflict Scene',
        description: 'The conflict intensifies',
        characters: finalCharacters.slice(0, 3).map(char => char.id),
        actions: ['Characters face a major obstacle'],
        setting: 'Secondary location',
        generationStatus: 'pending'
      },
      {
        id: 'scene-default-3',
        title: 'Resolution Scene',
        description: 'The story concludes',
        characters: finalCharacters.map(char => char.id),
        actions: ['Characters resolve their conflicts'],
        setting: 'Final location',
        generationStatus: 'pending'
      }
    ];
  }
  
  // Generate a summary using the first few paragraphs
  const summaryText = scriptText.substring(0, 500).trim();
  const endOfFirstParagraph = summaryText.indexOf('\n\n');
  const summary = endOfFirstParagraph > 0 ? 
    summaryText.substring(0, endOfFirstParagraph) + '...' : 
    summaryText + '...';
  
  console.log(`Analysis complete: ${finalCharacters.length} characters, ${finalScenes.length} scenes`);
  
  return {
    title: potentialTitle,
    summary,
    characters: finalCharacters,
    scenes: finalScenes
  };
};

/**
 * Function to manually add named character for when auto-extraction fails
 */
export const addNamedCharacter = (name: string, role: CharacterRole, existingCharacters: Character[]): Character => {
  const characterImages = [
    'public/lovable-uploads/d92d25df-8a20-4388-a978-6f26545f45a5.png',
    'public/lovable-uploads/a74dd3a1-8f81-426e-9dfd-ddacc2669762.png',
    'public/lovable-uploads/0f25fd33-4d81-4901-bf39-775060e2a0b9.png',
    'public/lovable-uploads/d1b481b4-fdd4-435d-a01c-9f863e3e1def.png',
    'public/lovable-uploads/3ae6df30-6eac-4604-81f4-2ace0197eda0.png',
    'public/lovable-uploads/eb922982-c40b-482f-975a-12cb014bb79c.png',
    'public/lovable-uploads/952c11d0-ee84-493e-ba6a-9d568470e138.png',
    'public/lovable-uploads/2acfc657-5e91-48ad-904f-bc4ba5dd0bba.png'
  ];
  
  // Choose an image based on the index
  const index = existingCharacters.length;
  const imageUrl = characterImages[index % characterImages.length];
  
  return {
    id: `character-manual-${Date.now()}`,
    name,
    description: `${name} is a ${role} character in the story`,
    role,
    traits: [role === 'protagonist' ? 'hero' : role === 'antagonist' ? 'villain' : 'supporting', 'character'],
    imageUrl,
    generationStatus: 'completed' as const
  };
};
