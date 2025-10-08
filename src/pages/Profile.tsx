import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, BookOpen, Target, Flame, Edit2, Save, Award, Code2 } from 'lucide-react';

interface ProfileData {
  username: string | null;
  total_lessons_completed: number;
  total_points: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
}

interface Badge {
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface LanguageProgress {
  language: string;
  completed: number;
  total: number;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [languageProgress, setLanguageProgress] = useState<LanguageProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchBadges();
      fetchLanguageProgress();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badges (
            name,
            description,
            icon
          )
        `)
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false });

      if (data) {
        const formattedBadges = data.map((item: any) => ({
          name: item.badges.name,
          description: item.badges.description,
          icon: item.badges.icon,
          earned_at: item.earned_at,
        }));
        setBadges(formattedBadges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchLanguageProgress = async () => {
    if (!user) return;

    try {
      // Get all lessons grouped by language
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('language');

      // Get user's completed lessons
      const { data: completedLessons } = await supabase
        .from('user_progress')
        .select(`
          lesson_id,
          lessons (
            language
          )
        `)
        .eq('user_id', user.id);

      if (allLessons && completedLessons) {
        const languageTotals: Record<string, number> = {};
        const languageCompleted: Record<string, number> = {};

        // Count total lessons per language
        allLessons.forEach((lesson: any) => {
          languageTotals[lesson.language] = (languageTotals[lesson.language] || 0) + 1;
        });

        // Count completed lessons per language
        completedLessons.forEach((progress: any) => {
          const lang = progress.lessons?.language;
          if (lang) {
            languageCompleted[lang] = (languageCompleted[lang] || 0) + 1;
          }
        });

        const progress = Object.keys(languageTotals).map(lang => ({
          language: lang.charAt(0).toUpperCase() + lang.slice(1),
          completed: languageCompleted[lang] || 0,
          total: languageTotals[lang],
        }));

        setLanguageProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching language progress:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated!',
        description: 'Your username has been saved.',
      });
      
      setEditing(false);
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Track your progress and achievements
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button onClick={saveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">
                      {profile?.username || 'Anonymous User'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Member since {memberSince} • {user?.email}
                  </CardDescription>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Earned from challenges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenges Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.total_lessons_completed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Debugging problems solved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Days of consistent practice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.best_streak || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Your personal record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Language Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Language Progress
          </CardTitle>
          <CardDescription>
            Your progress across different programming languages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {languageProgress.map((lang) => {
              const percentage = lang.total > 0 ? (lang.completed / lang.total) * 100 : 0;
              return (
                <div key={lang.language}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{lang.language}</span>
                    <span className="text-sm text-muted-foreground">
                      {lang.completed} / {lang.total}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {languageProgress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Code2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No progress yet. Start solving challenges!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Badges & Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges & Achievements
          </CardTitle>
          <CardDescription>
            Your earned badges and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-card"
                >
                  <div className="text-4xl">{badge.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No badges earned yet</p>
              <p className="text-sm">Complete challenges to earn your first badge!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
