import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalProps {
  output: string;
  isLoading?: boolean;
  height?: string;
}

export function Terminal({ output, isLoading = false, height = '200px' }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div 
      className="bg-muted/20 border border-border rounded-md p-4 code-font text-sm"
      style={{ height }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-muted-foreground">Terminal</span>
      </div>
      
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div ref={scrollRef} className="space-y-1">
          {output ? (
            <pre className="text-foreground whitespace-pre-wrap">{output}</pre>
          ) : (
            <div className="text-muted-foreground">
              {isLoading ? 'Running code...' : 'Output will appear here'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}