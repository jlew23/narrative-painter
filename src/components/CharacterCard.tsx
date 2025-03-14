
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Character } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, User2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CharacterCardProps {
  character: Character;
  onRegenerate: (characterId: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onRegenerate }) => {
  const getRoleBadgeColor = (role: Character['role']) => {
    switch (role) {
      case 'protagonist':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'antagonist':
        return 'bg-red-500 hover:bg-red-600';
      case 'supporting':
        return 'bg-green-500 hover:bg-green-600';
      case 'minor':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-scale-up">
      <CardHeader className="p-0">
        <div className="relative aspect-square w-full bg-muted/40 overflow-hidden">
          {character.generationStatus === 'generating' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 animate-pulse">
              <Skeleton className="h-full w-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-10 w-10 text-primary animate-spin opacity-70" />
              </div>
            </div>
          ) : character.imageUrl ? (
            <img 
              src={character.imageUrl} 
              alt={character.name} 
              className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <User2 className="h-16 w-16 text-muted-foreground opacity-25" />
            </div>
          )}
          
          <Badge className={`absolute top-2 right-2 ${getRoleBadgeColor(character.role)}`}>
            {character.role}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{character.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {character.description}
        </p>
      </CardContent>
      
      <CardFooter className="px-4 py-3 bg-muted/20 border-t flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {character.traits.slice(0, 3).map((trait, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-background">
              {trait}
            </Badge>
          ))}
          {character.traits.length > 3 && (
            <Badge variant="outline" className="text-xs bg-background">
              +{character.traits.length - 3}
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onRegenerate(character.id)}
          disabled={character.generationStatus === 'generating'}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CharacterCard;
