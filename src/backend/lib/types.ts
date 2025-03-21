
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'unknown';

export interface Character {
  id: string;
  name: string;
  description: string;
  role: CharacterRole;
  traits: string[];
  imageUrl?: string;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  characters: string[]; // Character IDs
  actions: string[];
  setting: string;
  imageUrl?: string;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface Storyboard {
  id: string;
  title: string;
  scenes: Scene[];
  audioUrl?: string;
}

export interface ScriptAnalysisResult {
  characters: Character[];
  scenes: Scene[];
  title: string;
  summary: string;
}
