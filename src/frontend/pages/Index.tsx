import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Users, 
  Film, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Character, Scene, ScriptAnalysisResult } from '@/lib/types';
import ScriptInput from '../components/ScriptInput';
import CharacterExtractor from '../components/CharacterExtractor';
import StoryboardGenerator from '@/components/StoryboardGenerator';
import { analyzeScript } from '../lib/characterExtraction';
import { initializeNLPPipeline } from '../lib/characterExtraction';

const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'char1',
    name: 'Emma Chen',
    description: 'A brilliant tech entrepreneur in her early 30s with a determined spirit',
    role: 'protagonist',
    traits: ['intelligent', 'ambitious', 'resourceful'],
    generationStatus: 'completed'
  },
  {
    id: 'char2',
    name: 'Marcus Reynolds',
    description: 'A corporate rival who will stop at nothing to acquire Emma\'s technology',
    role: 'antagonist',
    traits: ['cunning', 'ruthless', 'charismatic'],
    generationStatus: 'completed'
  }
];

const SAMPLE_SCENES: Scene[] = [
  {
    id: 'scene1',
    title: 'Lab Breakthrough',
    description: 'Emma makes a breakthrough in her research lab',
    characters: ['char1'],
    actions: [
      'Emma works frantically at her lab station',
      'The algorithm finally compiles successfully',
      'Emma reacts with excitement and relief'
    ],
    setting: 'A high-tech research laboratory filled with cutting-edge equipment',
    generationStatus: 'completed'
  },
  {
    id: 'scene2',
    title: 'Corporate Showdown',
    description: 'Emma confronts Marcus about stealing her research',
    characters: ['char1', 'char2'],
    actions: [
      'Emma barges into Marcus\' executive office',
      'She accuses him of corporate espionage',
      'Marcus denies everything with a smug smile'
    ],
    setting: 'Sleek corporate office with floor-to-ceiling windows overlooking the city',
    generationStatus: 'completed'
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'home' | 'script' | 'characters' | 'storyboard'>('home');
  const [scriptContent, setScriptContent] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleScriptSubmit = async (script: string) => {
    setScriptContent(script);
    setAnalyzing(true);
    
    try {
      toast.info('Analyzing script...');
      
      await initializeNLPPipeline();
      
      const result = await analyzeScript(script);
      
      setAnalysisResult(result);
      
      setCurrentView('characters');
      toast.success('Script analysis complete!');
      
      console.log('Script analysis completed with results:', result);
      console.log(`Found ${result.characters.length} characters and ${result.scenes.length} scenes`);
    } catch (error) {
      console.error('Error analyzing script:', error);
      toast.error('Failed to analyze script. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateStoryboard = (storyboard: any) => {
    toast.success('Storyboard generated successfully!');
    setCurrentView('storyboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'script':
        return (
          <div className="w-full max-w-4xl mx-auto">
            <ScriptInput onAnalyze={handleScriptSubmit} />
          </div>
        );
      
      case 'characters':
        return (
          <div className="w-full max-w-5xl mx-auto">
            {analysisResult && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{analysisResult.title}</h2>
                  <Button onClick={() => setCurrentView('storyboard')}>
                    Continue to Storyboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                
                <CharacterExtractor 
                  analysisResult={analysisResult}
                  onCharactersGenerated={(characters) => {
                    if (analysisResult) {
                      setAnalysisResult({
                        ...analysisResult,
                        characters
                      });
                    }
                  }}
                  onRegenerateCharacter={(characterId) => {
                    console.log(`Regenerating character: ${characterId}`);
                  }}
                />
              </div>
            )}
          </div>
        );
      
      case 'storyboard':
        return (
          <div className="w-full max-w-6xl mx-auto">
            {analysisResult && (
              <StoryboardGenerator 
                scenes={analysisResult.scenes}
                characters={analysisResult.characters}
                scriptTitle={analysisResult.title}
                onGenerateStoryboard={handleGenerateStoryboard}
              />
            )}
          </div>
        );
      
      default:
        return (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 pb-2">
                Script Visualizer Pro
              </h1>
              <p className="mt-4 text-xl text-muted-foreground">
                Transform your scripts into visual storyboards and character designs with AI
              </p>
              <div className="mt-8">
                <Button size="lg" onClick={() => setCurrentView('script')} className="animate-fade-in">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Visualizing
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <FeatureCard 
                icon={<FileText className="h-10 w-10 text-primary" />}
                title="Script Analysis"
                description="Upload your script and our AI will extract characters, scenes, and critical story elements"
              />
              <FeatureCard 
                icon={<Users className="h-10 w-10 text-primary" />}
                title="Character Generation"
                description="Create visual representations of your characters based on script descriptions"
              />
              <FeatureCard 
                icon={<Film className="h-10 w-10 text-primary" />}
                title="Storyboard Animation"
                description="Transform scenes into animated storyboards with synchronized narration"
              />
            </div>
            
            <div className="rounded-lg border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <ol className="space-y-4">
                <StepItem number={1} title="Upload Your Script">
                  Enter or paste your script (up to 15,000 words) into our editor.
                </StepItem>
                <StepItem number={2} title="Review Characters">
                  Our AI identifies characters and suggests visual representations.
                </StepItem>
                <StepItem number={3} title="Generate Storyboard">
                  Create a visual storyboard from identified scenes and actions.
                </StepItem>
                <StepItem number={4} title="Export & Share">
                  Export your animated storyboard in various formats for easy sharing.
                </StepItem>
              </ol>
              <div className="mt-6 text-center">
                <Button size="lg" onClick={() => setCurrentView('script')}>
                  Try It Now
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <Layers className="h-6 w-6 text-primary" />
            <span>Script Visualizer</span>
          </button>
          
          {currentView !== 'home' && (
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={() => setCurrentView('script')}
                className={`px-3 py-1 rounded-md ${currentView === 'script' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
              >
                Script
              </button>
              <button 
                onClick={() => setCurrentView('characters')}
                className={`px-3 py-1 rounded-md ${currentView === 'characters' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                disabled={!analysisResult}
              >
                Characters
              </button>
              <button 
                onClick={() => setCurrentView('storyboard')}
                className={`px-3 py-1 rounded-md ${currentView === 'storyboard' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                disabled={!analysisResult}
              >
                Storyboard
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      
      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Script Visualizer Pro • All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow hover-scale">
      <CardContent className="pt-6">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const StepItem = ({ number, title, children }: { 
  number: number; 
  title: string; 
  children: React.ReactNode;
}) => {
  return (
    <li className="flex items-start gap-4">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </li>
  );
};

export default Index;
