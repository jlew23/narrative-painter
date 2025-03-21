import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, PlusCircle, CheckCircle2, Sparkles, FileWarning } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptInputProps {
  onAnalyze: (script: string) => void;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ onAnalyze }) => {
  const [script, setScript] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [isOverLimit, setIsOverLimit] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_WORDS = 15000;

  // Sample script button options
  const sampleScripts = [
    { name: 'Dramatic Scene', content: SAMPLE_DRAMATIC_SCENE },
    { name: 'Action Sequence', content: SAMPLE_ACTION_SEQUENCE },
    { name: 'Comedy Dialogue', content: SAMPLE_COMEDY_DIALOGUE },
  ];

  useEffect(() => {
    const words = script.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setIsOverLimit(words > MAX_WORDS);
  }, [script]);

  const handleInsertSample = (content: string) => {
    setScript(content);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    toast.success('Sample script inserted');
  };

  const handleAnalyze = () => {
    if (script.trim().length === 0) {
      toast.error('Please enter a script first');
      return;
    }
    
    if (isOverLimit) {
      toast.error(`Script exceeds maximum length of ${MAX_WORDS} words`);
      return;
    }
    
    onAnalyze(script);
    toast.success('Analyzing script...');
  };

  return (
    <Card className="w-full h-full bg-white/80 backdrop-blur-sm shadow-md border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Script Editor
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border-t border-slate-200 dark:border-slate-800 mb-0">
          <div className="flex flex-wrap gap-2 p-2 bg-muted/50">
            {sampleScripts.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleInsertSample(sample.content)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                {sample.name}
              </Button>
            ))}
          </div>
        </div>
        
        <Textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="INT. LIVING ROOM - NIGHT

JOHN, a weary detective in his 40s, enters the dimly lit room.

JOHN
(sighing)
Another day, another case.

He tosses his badge onto the coffee table and collapses onto the sofa."
          className="script-input min-h-[400px] md:min-h-[500px] rounded-none focus:ring-0 focus-visible:ring-0"
        />
      </CardContent>
      
      <CardFooter className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="text-sm flex items-center">
          {isOverLimit ? (
            <FileWarning className="h-4 w-4 text-destructive mr-2" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-primary/80 mr-2" />
          )}
          <span className={isOverLimit ? 'text-destructive' : 'text-muted-foreground'}>
            {wordCount} / {MAX_WORDS} words
          </span>
        </div>
        
        <Button onClick={handleAnalyze} disabled={isOverLimit || script.trim().length === 0}>
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze Script
        </Button>
      </CardFooter>
    </Card>
  );
};

// Sample scripts for the demo
const SAMPLE_DRAMATIC_SCENE = `INT. HOSPITAL ROOM - NIGHT

SARAH, 35, sits beside a hospital bed where her father, ROBERT, 70s, lies connected to various machines. The steady beep of heart monitors fills the silence.

SARAH
(holding his hand)
Dad, can you hear me?

Robert's eyes flutter but remain closed. Sarah leans closer.

SARAH
(continuing)
I found the letters. I know about mom.

Robert's fingers twitch slightly. Sarah wipes a tear.

SARAH
Why didn't you ever tell me?

The door opens. DR. MILLER, 40s, enters with a clipboard.

DR. MILLER
Ms. Johnson? May I speak with you outside?

Sarah nods, gently places her father's hand down, and follows the doctor out.

INT. HOSPITAL HALLWAY - CONTINUOUS

Dr. Miller's expression is grim. Sarah braces herself.

DR. MILLER
The test results aren't what we hoped for.`;

const SAMPLE_ACTION_SEQUENCE = `EXT. ROOFTOP - NIGHT

Rain pours down as DETECTIVE ALEX MERCER, 38, muscular build with a tattered jacket, sprints across the slippery surface. Behind him, THREE MASKED GUNMEN give chase, firing occasional shots.

Alex dives behind a ventilation unit as bullets ping off metal.

ALEX
(into radio)
Parker, I could use that backup now!

PARKER (V.O.)
(through radio)
Three minutes out. Can you hold?

Alex checks his gun - two bullets left.

ALEX
(sardonic)
No problem. Take your time.

He peeks out, spots a gunman approaching, and waits for the perfect moment.

ALEX
(whispering)
Come on...

The gunman steps into view. Alex lunges, disarms him with a swift move, and knocks him unconscious with a punch.

The remaining gunmen open fire. Alex rolls, grabbing the fallen weapon, and returns fire as he runs toward the edge of the building.

THUG #1
He's cornered!

Without hesitation, Alex leaps off the edge of the seven-story building.

EXT. ADJACENT BUILDING - CONTINUOUS

Alex crashes through a glass skylight, tumbling onto the floor of an empty office.`;

const SAMPLE_COMEDY_DIALOGUE = `INT. COFFEE SHOP - DAY

MIKE, 30, disheveled in yesterday's clothes, slumps at a table. His friend TAYLOR, 29, impeccably dressed, approaches with two coffees.

TAYLOR
You look like you were hit by a truck. Then reversed over. Then hit again.

MIKE
(groaning)
Thanks. That's the look I was going for.

Taylor slides a coffee to Mike, who grabs it desperately.

TAYLOR
So? How was the blind date?

MIKE
Remember when you said she had a "great personality"?

TAYLOR
That bad?

MIKE
She brought her mother. And her cat. In a stroller.

Taylor bursts out laughing, nearly spitting coffee.

TAYLOR
No way!

MIKE
The cat had its own menu! The mother ordered for both of them!

TAYLOR
Well, technically I said she came from a good family. Now we know why.

Mike glares at Taylor.

MIKE
You're enjoying this too much.

TAYLOR
(grinning)
I'm going to enjoy it even more when you realize that's her walking in right now.

Mike spins around in panic. Nobody's there. Taylor laughs harder.`;

export default ScriptInput;
