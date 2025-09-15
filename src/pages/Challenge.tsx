import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodeEditor } from '@/components/code-editor';
import { Terminal } from '@/components/terminal';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, RotateCcw, Play, CheckCircle, ArrowRight } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  description: string;
  starter_code: string;
  expected_output: string;
  hints: string[];
  points: number;
}

export default function Challenge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [showHints, setShowHints] = useState<boolean[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [loading, setLoading] = useState(true);

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ];

  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-orange-500',
    expert: 'bg-red-500',
  };

  useEffect(() => {
    fetchLessons();
  }, [selectedLanguage]);

  useEffect(() => {
    if (currentLesson) {
      setCode(currentLesson.starter_code);
      setOutput('');
      setShowHints([]);
    }
  }, [currentLesson]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('language', selectedLanguage as any)
        .order('order_index');

      if (error) throw error;

      setLessons(data || []);
      if (data && data.length > 0 && !currentLesson) {
        setCurrentLesson(data[0]);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lessons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    
    // Simulate code execution (in a real app, this would call a secure code execution service)
    setTimeout(() => {
      // Simple simulation based on expected output
      if (currentLesson) {
        const trimmedCode = code.trim();
        const expectedOutput = currentLesson.expected_output.trim();
        
        // Very basic simulation - in production, use a secure sandboxed environment
        if (currentLesson.language === 'python' && currentLesson.title === 'Off-by-One Error in Loop') {
          if (trimmedCode.includes('range(1, 6)')) {
            setOutput(expectedOutput);
          } else if (trimmedCode.includes('range(1, 7)')) {
            setOutput('1\n2\n3\n4\n5\n6');
          } else {
            setOutput('Error: Invalid code or syntax error');
          }
        } else {
          // For other lessons, provide a generic simulation
          setOutput('Code executed successfully!\n' + expectedOutput);
        }
      }
      setIsRunning(false);
    }, 1500);
  };

  const checkSolution = () => {
    if (!currentLesson) return;

    const actualOutput = output.trim();
    const expectedOutput = currentLesson.expected_output.trim();

    if (actualOutput === expectedOutput) {
      toast({
        title: 'Correct Solution!',
        description: `You earned ${currentLesson.points} points!`,
        variant: 'default',
      });
      
      // In a real app, save progress to database
      saveProgress();
      
      // Move to next lesson
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } else {
      toast({
        title: 'Not quite right',
        description: 'The output doesn\'t match the expected result. Try again!',
        variant: 'destructive',
      });
    }
  };

  const saveProgress = async () => {
    if (!user || !currentLesson) return;

    try {
      const hintsUsed = showHints.filter(Boolean).length;
      
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        lesson_id: currentLesson.id,
        hints_used: hintsUsed,
        attempts: 1,
      });

      // Update profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_lessons_completed, total_points')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_lessons_completed: (profile.total_lessons_completed || 0) + 1,
            total_points: (profile.total_points || 0) + currentLesson.points,
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const showHint = (index: number) => {
    const newShowHints = [...showHints];
    newShowHints[index] = true;
    setShowHints(newShowHints);
  };

  const resetCode = () => {
    if (currentLesson) {
      setCode(currentLesson.starter_code);
      setOutput('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Challenge</h1>
          <p className="text-muted-foreground">
            Fix the code to produce the expected output
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        {/* Left Panel - Challenge Description */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {currentLesson?.title}
                <Badge
                  className={`text-white ${
                    difficultyColors[currentLesson?.difficulty as keyof typeof difficultyColors]
                  }`}
                >
                  {currentLesson?.difficulty}
                </Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {currentLesson?.points} points
              </div>
            </div>
            <CardDescription>{currentLesson?.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Expected Output:</h4>
              <pre className="bg-muted p-3 rounded-md text-sm code-font">
                {currentLesson?.expected_output}
              </pre>
            </div>

            {currentLesson?.hints && currentLesson.hints.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Hints:</h4>
                <div className="space-y-2">
                  {currentLesson.hints.map((hint, index) => (
                    <div key={index}>
                      {showHints[index] ? (
                        <div className="bg-muted p-3 rounded-md text-sm">
                          <Lightbulb className="inline h-4 w-4 text-yellow-500 mr-2" />
                          {hint}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showHint(index)}
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Show Hint {index + 1}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Code Editor and Terminal */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetCode}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={runCode} disabled={isRunning}>
                    <Play className="h-4 w-4 mr-2" />
                    {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CodeEditor
                language={currentLesson?.language || 'python'}
                value={code}
                onChange={(value) => setCode(value || '')}
                height="300px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Output</CardTitle>
                <Button onClick={checkSolution} disabled={!output || isRunning}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check Solution
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Terminal output={output} isLoading={isRunning} height="200px" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}