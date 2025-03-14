
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Scene, Character, Storyboard } from '@/lib/types';
import { Film, Sparkles, Play, Pause, SkipBack, SkipForward, Clock, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatSceneForPrompt, breakdownSceneIntoKeyFrames } from '@/lib/storyboardGeneration';
import { cn } from '@/lib/utils';

interface StoryboardGeneratorProps {
  scenes: Scene[];
  characters: Character[];
  scriptTitle: string;
  onGenerateStoryboard: (storyboard: Storyboard) => void;
}

const StoryboardGenerator: React.FC<StoryboardGeneratorProps> = ({
  scenes,
  characters,
  scriptTitle,
  onGenerateStoryboard
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  
  const activeScene = scenes[activeSceneIndex];
  
  const handleGenerateAll = () => {
    setIsGenerating(true);
    toast.success('Generating storyboard panels...');
    
    // In a real app, this would call an AI image generation service
    // For the demo, we'll simulate the process
    setTimeout(() => {
      const generated = scenes.map(scene => ({
        ...scene,
        imageUrl: '/placeholder.svg',
        generationStatus: 'completed' as const
      }));
      
      setGeneratedScenes(generated);
      
      // Create a storyboard object
      const storyboard: Storyboard = {
        id: `storyboard-${Date.now()}`,
        title: scriptTitle,
        scenes: generated
      };
      
      onGenerateStoryboard(storyboard);
      setIsGenerating(false);
      toast.success('Storyboard generation completed!');
    }, 3000);
  };
  
  const handlePlayPause = () => {
    if (generatedScenes.length === 0) {
      toast.error('Generate storyboard first to play animation');
      return;
    }
    
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.success('Animation started');
    } else {
      toast.info('Animation paused');
    }
  };
  
  const handlePrevScene = () => {
    if (activeSceneIndex > 0) {
      setActiveSceneIndex(activeSceneIndex - 1);
    }
  };
  
  const handleNextScene = () => {
    if (activeSceneIndex < scenes.length - 1) {
      setActiveSceneIndex(activeSceneIndex + 1);
    }
  };
  
  // Get characters in the active scene
  const sceneCharacters = activeScene
    ? characters.filter(char => activeScene.characters.includes(char.id))
    : [];
  
  // Get key moments for the active scene
  const keyMoments = activeScene
    ? breakdownSceneIntoKeyFrames(activeScene)
    : [];

  return (
    <Card className="w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm shadow-md border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <span>Storyboard</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleGenerateAll}
              disabled={isGenerating || scenes.length === 0}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Generate All Panels
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {scenes.length > 0 ? (
          <>
            <div className="border-y border-slate-200 dark:border-slate-800 p-2 flex justify-between items-center">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePrevScene}
                  disabled={activeSceneIndex === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNextScene}
                  disabled={activeSceneIndex === scenes.length - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Scene {activeSceneIndex + 1} of {scenes.length}
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-video relative overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                {activeScene?.imageUrl ? (
                  <img 
                    src={activeScene.imageUrl} 
                    alt={activeScene.title} 
                    className="w-full h-full object-cover"
                  />
                ) : isGenerating ? (
                  <div className="text-center animate-pulse">
                    <Sparkles className="h-12 w-12 mb-2 mx-auto text-primary/70" />
                    <p className="text-muted-foreground">Generating storyboard...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Monitor className="h-12 w-12 mb-2 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground">Scene preview will appear here</p>
                  </div>
                )}
                
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    {activeScene?.title}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Scene Details</TabsTrigger>
                    <TabsTrigger value="characters">Characters</TabsTrigger>
                    <TabsTrigger value="moments">Key Moments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="m-0">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Scene Title</h3>
                        <p className="font-medium">{activeScene?.title}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Setting</h3>
                        <p>{activeScene?.setting}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                        <p className="text-sm">{activeScene?.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Prompt for Generation</h3>
                        <div className="bg-muted/50 p-3 rounded-md text-xs font-mono">
                          {activeScene && formatSceneForPrompt(activeScene, characters)}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="characters" className="m-0">
                    {sceneCharacters.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sceneCharacters.map(character => (
                          <div key={character.id} className="bg-muted/30 rounded-md p-2 flex items-center gap-2">
                            <div className="h-10 w-10 rounded overflow-hidden bg-muted/50 flex-shrink-0">
                              {character.imageUrl ? (
                                <img 
                                  src={character.imageUrl} 
                                  alt={character.name} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User2 className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{character.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{character.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No characters in this scene</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="moments" className="m-0">
                    {keyMoments.length > 0 ? (
                      <div className="space-y-3">
                        {keyMoments.map((moment, index) => (
                          <div 
                            key={index} 
                            className={cn(
                              "p-3 rounded-md border border-border transition-all duration-300",
                              index === 0 && "bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-background/50">
                                Moment {index + 1}
                              </Badge>
                              {index === 0 && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{moment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No key moments identified</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {generatedScenes.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-medium mb-3">Storyboard Timeline</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden">
                  {generatedScenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      className={cn(
                        "flex-shrink-0 w-28 aspect-video rounded-md overflow-hidden border-2 transition-all duration-200",
                        activeSceneIndex === index 
                          ? "border-primary shadow-md" 
                          : "border-transparent hover:border-border"
                      )}
                      onClick={() => setActiveSceneIndex(index)}
                    >
                      <img 
                        src={scene.imageUrl || '/placeholder.svg'} 
                        alt={scene.title} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-1">No Scenes Available</h3>
            <p className="text-muted-foreground mb-4">
              Enter and analyze a script to generate storyboard panels
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t border-slate-200 dark:border-slate-800 p-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Estimated animation length: {scenes.length > 0 ? Math.ceil(scenes.length * 1.5) : 0} minutes</span>
        </div>
      </CardFooter>
    </Card>
  );
};

// For TypeScript error resolution
const User2 = Film;

export default StoryboardGenerator;
