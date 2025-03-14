
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Character, CharacterRole, ScriptAnalysisResult } from '@/lib/types';
import { Users, UserCheck, UserCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CharacterCard from './CharacterCard';
import { toast } from 'sonner';

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
  
  useEffect(() => {
    if (analysisResult?.characters) {
      setCharacters(analysisResult.characters);
    }
  }, [analysisResult]);

  const handleGenerateAllImages = () => {
    // In a real app, this would call an AI image generation service
    // For the demo, we'll simulate the process
    
    toast.success('Generating character images...');
    
    // Update all characters to "generating" status
    const updatingCharacters = characters.map(char => ({
      ...char,
      generationStatus: 'generating' as const
    }));
    setCharacters(updatingCharacters);
    
    // Simulate completion after a delay
    setTimeout(() => {
      const generatedCharacters = updatingCharacters.map(char => ({
        ...char,
        // In a real app, this would be the URL from the image generation service
        imageUrl: `/placeholder.svg`,
        generationStatus: 'completed' as const
      }));
      
      setCharacters(generatedCharacters);
      onCharactersGenerated(generatedCharacters);
      toast.success('All character images generated!');
    }, 2000);
  };

  const handleRegenerateCharacter = (characterId: string) => {
    // Update specific character to "generating" status
    setCharacters(prev => 
      prev.map(char => 
        char.id === characterId 
          ? {...char, generationStatus: 'generating' as const}
          : char
      )
    );
    
    // Simulate regeneration after a delay
    setTimeout(() => {
      setCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? {
                ...char, 
                imageUrl: `/placeholder.svg?v=${Date.now()}`,
                generationStatus: 'completed' as const
              }
            : char
        )
      );
      onRegenerateCharacter(characterId);
      toast.success(`Regenerated ${characters.find(c => c.id === characterId)?.name || 'character'}`);
    }, 1500);
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
            <span>Characters</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={handleGenerateAllImages}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Generate All Images
          </Button>
        </CardTitle>
      </CardHeader>
      
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
