
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Character, CharacterRole, ScriptAnalysisResult } from '@/lib/types';
import { Users, UserCheck, UserCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CharacterCard from './CharacterCard';
import { toast } from 'sonner';
import { generateCharacterImage } from '@/lib/storyboardGeneration';
import { initializeTextToImagePipeline } from '@/lib/storyboardGeneration';
import { Progress } from '@/components/ui/progress';

interface CharacterExtractorProps {
  analysisResult: ScriptAnalysisResult | null;
  onCharactersGenerated: (characters: Character[]) => void;
  onRegenerateCharacter: (characterId: string) => void;
}

const CharacterExtractor: React.FC<CharacterExtractorProps> = ({ 
  analysisResult, 
  onCharactersGenerated,
  onRegenerateCharacter
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (analysisResult?.characters) {
      setCharacters(analysisResult.characters);
    }
  }, [analysisResult]);

  const handleGenerateAllImages = async () => {
    // Initialize Hugging Face pipeline
    const pipelineInitialized = await initializeTextToImagePipeline();
    if (!pipelineInitialized) {
      toast.error('Failed to initialize image generation. Using placeholders instead.');
    }
    
    // Update all characters to "generating" status
    const updatingCharacters = characters.map(char => ({
      ...char,
      generationStatus: 'generating' as const
    }));
    setCharacters(updatingCharacters);
    setIsGenerating(true);
    setProgress(0);
    toast.success('Generating character images...');
    
    try {
      // Generate images for all characters one by one
      const generatedCharacters: Character[] = [...updatingCharacters];
      
      for (let i = 0; i < generatedCharacters.length; i++) {
        const char = generatedCharacters[i];
        try {
          // Call the actual image generation function
          const imageUrl = await generateCharacterImage(char);
          
          // Update the character with the generated image
          generatedCharacters[i] = {
            ...char,
            imageUrl,
            generationStatus: 'completed' as const
          };
          
          // Update progress
          const newProgress = Math.round(((i + 1) / generatedCharacters.length) * 100);
          setProgress(newProgress);
          
          // Update the state to show progress
          setCharacters([...generatedCharacters]);
        } catch (error) {
          console.error(`Error generating image for ${char.name}:`, error);
          generatedCharacters[i] = {
            ...char,
            imageUrl: '/placeholder.svg',
            generationStatus: 'failed' as const
          };
        }
      }
      
      setCharacters(generatedCharacters);
      onCharactersGenerated(generatedCharacters);
      toast.success('All character images generated!');
    } catch (error) {
      console.error('Error generating character images:', error);
      toast.error('Failed to generate some character images');
      
      // Mark all as completed with placeholder images
      const fallbackCharacters: Character[] = characters.map(char => ({
        ...char,
        imageUrl: '/placeholder.svg',
        generationStatus: 'completed' as const
      }));
      
      setCharacters(fallbackCharacters);
      onCharactersGenerated(fallbackCharacters);
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  const handleRegenerateCharacter = async (characterId: string) => {
    // Find the character to regenerate
    const character = characters.find(char => char.id === characterId);
    if (!character) {
      toast.error('Character not found');
      return;
    }
    
    // Update specific character to "generating" status
    setCharacters(prev => 
      prev.map(char => 
        char.id === characterId 
          ? {...char, generationStatus: 'generating' as const}
          : char
      )
    );
    
    try {
      // Initialize pipeline if needed
      const pipelineInitialized = await initializeTextToImagePipeline();
      if (!pipelineInitialized) {
        toast.error('Failed to initialize image generation. Using placeholder instead.');
      }
      
      // Generate new image
      const imageUrl = await generateCharacterImage(character);
      
      // Update character with new image
      setCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? {
                ...char, 
                imageUrl,
                generationStatus: 'completed' as const
              }
            : char
        )
      );
      
      // Call the parent component's callback
      onRegenerateCharacter(characterId);
      toast.success(`Regenerated ${character.name}`);
    } catch (error) {
      console.error(`Error regenerating image for character ${characterId}:`, error);
      toast.error('Failed to regenerate character image');
      
      // Set to completed with placeholder
      setCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? {
                ...char, 
                imageUrl: '/placeholder.svg',
                generationStatus: 'failed' as const
              }
            : char
        )
      );
    }
  };

  // Filter characters based on active tab
  const filteredCharacters = characters.filter(char => {
    if (activeTab === 'all') return true;
    if (activeTab === 'protagonist') return char.role === 'protagonist';
    if (activeTab === 'antagonist') return char.role === 'antagonist';
    if (activeTab === 'supporting') return char.role === 'supporting' || char.role === 'minor';
    return true;
  });
  
  const roleGroups: Record<CharacterRole, Character[]> = {
    protagonist: characters.filter(c => c.role === 'protagonist'),
    antagonist: characters.filter(c => c.role === 'antagonist'),
    supporting: characters.filter(c => c.role === 'supporting'),
    minor: characters.filter(c => c.role === 'minor'),
    unknown: characters.filter(c => c.role === 'unknown')
  };

  if (!analysisResult) {
    return null;
  }

  return (
    <Card className="w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm shadow-md border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Characters ({characters.length})</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={handleGenerateAllImages}
            disabled={isGenerating || characters.length === 0}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {isGenerating ? 'Generating...' : 'Generate All Images'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isGenerating && (
        <div className="px-4 py-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center mt-1 text-muted-foreground">
            Generating images... {progress}%
          </p>
        </div>
      )}
      
      <CardContent className="p-0">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-y border-slate-200 dark:border-slate-800">
            <TabsList className="justify-start h-auto p-0 bg-transparent w-full overflow-x-auto scrollbar-hidden">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                All ({characters.length})
              </TabsTrigger>
              <TabsTrigger 
                value="protagonist" 
                className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Protagonists ({roleGroups.protagonist.length})
              </TabsTrigger>
              <TabsTrigger 
                value="antagonist" 
                className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Antagonists ({roleGroups.antagonist.length})
              </TabsTrigger>
              <TabsTrigger 
                value="supporting" 
                className="data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Supporting ({roleGroups.supporting.length + roleGroups.minor.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredCharacters.length > 0 ? (
                filteredCharacters.map(character => (
                  <CharacterCard 
                    key={character.id} 
                    character={character} 
                    onRegenerate={handleRegenerateCharacter}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No characters found in this category</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="protagonist" className="m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredCharacters.length > 0 ? (
                filteredCharacters.map(character => (
                  <CharacterCard 
                    key={character.id} 
                    character={character} 
                    onRegenerate={handleRegenerateCharacter}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No protagonists found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="antagonist" className="m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredCharacters.length > 0 ? (
                filteredCharacters.map(character => (
                  <CharacterCard 
                    key={character.id} 
                    character={character} 
                    onRegenerate={handleRegenerateCharacter}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No antagonists found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="supporting" className="m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredCharacters.length > 0 ? (
                filteredCharacters.map(character => (
                  <CharacterCard 
                    key={character.id} 
                    character={character} 
                    onRegenerate={handleRegenerateCharacter}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No supporting characters found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t border-slate-200 dark:border-slate-800 p-3 text-sm text-muted-foreground flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          <span>{characters.length} characters identified</span>
        </div>
        
        <div className="text-sm">
          {characters.filter(c => c.generationStatus === 'completed').length} of {characters.length} visualized
        </div>
      </CardFooter>
    </Card>
  );
};

export default CharacterExtractor;
