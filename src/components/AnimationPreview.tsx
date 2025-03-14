
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Storyboard, Scene } from '@/lib/types';
import { Play, Pause, VolumeX, Volume2, SkipBack, SkipForward, Maximize, Minimize, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnimationPreviewProps {
  storyboard: Storyboard | null;
}

const AnimationPreview: React.FC<AnimationPreviewProps> = ({ storyboard }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(80);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Scene transition timing in milliseconds
  const SCENE_DURATION = 3000;
  
  useEffect(() => {
    if (storyboard) {
      setCurrentSceneIndex(0);
      setProgress(0);
      setIsPlaying(false);
    }
  }, [storyboard]);
  
  useEffect(() => {
    if (isPlaying && storyboard?.scenes.length) {
      // Clear any existing interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      
      const startTime = Date.now();
      const totalDuration = storyboard.scenes.length * SCENE_DURATION;
      
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / totalDuration) * 100;
        
        if (newProgress >= 100) {
          setProgress(100);
          setCurrentSceneIndex(storyboard.scenes.length - 1);
          setIsPlaying(false);
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        
        setProgress(newProgress);
        
        // Calculate which scene should be shown
        const newSceneIndex = Math.min(
          Math.floor(elapsed / SCENE_DURATION),
          storyboard.scenes.length - 1
        );
        
        if (newSceneIndex !== currentSceneIndex) {
          setCurrentSceneIndex(newSceneIndex);
        }
      }, 50);
      
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isPlaying, storyboard, currentSceneIndex]);
  
  const handlePlayPause = () => {
    if (!storyboard?.scenes.length) {
      toast.error('No storyboard available to preview');
      return;
    }
    
    if (progress >= 100) {
      // Restart from beginning if at end
      setProgress(0);
      setCurrentSceneIndex(0);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleProgressChange = (newValue: number[]) => {
    if (!storyboard?.scenes.length) return;
    
    const newProgress = newValue[0];
    setProgress(newProgress);
    
    const totalDuration = storyboard.scenes.length * SCENE_DURATION;
    const elapsed = (newProgress / 100) * totalDuration;
    const newSceneIndex = Math.min(
      Math.floor(elapsed / SCENE_DURATION),
      storyboard.scenes.length - 1
    );
    
    setCurrentSceneIndex(newSceneIndex);
  };
  
  const handlePrevScene = () => {
    if (!storyboard?.scenes.length) return;
    
    const newIndex = Math.max(0, currentSceneIndex - 1);
    setCurrentSceneIndex(newIndex);
    setProgress((newIndex / storyboard.scenes.length) * 100);
  };
  
  const handleNextScene = () => {
    if (!storyboard?.scenes.length) return;
    
    const newIndex = Math.min(storyboard.scenes.length - 1, currentSceneIndex + 1);
    setCurrentSceneIndex(newIndex);
    setProgress((newIndex / storyboard.scenes.length) * 100);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const currentScene = storyboard?.scenes[currentSceneIndex];
  const totalDuration = storyboard?.scenes.length ? storyboard.scenes.length * (SCENE_DURATION / 1000) : 0;
  const currentTime = (progress / 100) * totalDuration;
  
  return (
    <Card ref={containerRef} className={cn(
      "w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm shadow-md border border-slate-200 dark:border-slate-800",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-none"
    )}>
      <CardHeader className={cn("pb-2", isFullscreen && "p-2")}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <span>Animation Preview</span>
          </div>
          
          {!isFullscreen && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={cn("p-0", isFullscreen && "flex-grow flex flex-col")}>
        <div className={cn(
          "relative aspect-video bg-black overflow-hidden",
          isFullscreen && "flex-grow flex items-center justify-center"
        )}>
          {currentScene?.imageUrl ? (
            <img 
              src={currentScene.imageUrl} 
              alt={currentScene.title} 
              className={cn(
                "w-full h-full object-contain transition-opacity duration-300",
                isPlaying ? "animate-fade-in" : ""
              )}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/70">No preview available</p>
            </div>
          )}
          
          {/* Caption overlay */}
          {currentScene && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
              <h3 className="font-medium mb-1">{currentScene.title}</h3>
              <p className="text-sm text-white/70 line-clamp-2">
                {currentScene.actions[0] || currentScene.description}
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{formatTime(currentTime)}</span>
            <Slider 
              value={[progress]} 
              min={0} 
              max={100} 
              step={0.1}
              onValueChange={handleProgressChange}
              className="mx-4 flex-grow"
            />
            <span className="text-sm text-muted-foreground">{formatTime(totalDuration)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <Slider 
                value={[isMuted ? 0 : volume]} 
                min={0} 
                max={100} 
                onValueChange={(v) => setVolume(v[0])}
                className="w-24"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevScene}
                disabled={!storyboard?.scenes.length || currentSceneIndex === 0}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="default" 
                className="w-20 button-shine"
                onClick={handlePlayPause}
                disabled={!storyboard?.scenes.length}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextScene}
                disabled={!storyboard?.scenes.length || currentSceneIndex === (storyboard?.scenes.length - 1)}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            
            {isFullscreen && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleFullscreen}
              >
                <Minimize className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={cn(
        "border-t border-slate-200 dark:border-slate-800 p-3 text-sm text-muted-foreground",
        isFullscreen && "p-2"
      )}>
        <div className="flex items-center gap-2">
          {storyboard ? (
            <>Scene {currentSceneIndex + 1} of {storyboard.scenes.length}</>
          ) : (
            <>No storyboard available</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AnimationPreview;
