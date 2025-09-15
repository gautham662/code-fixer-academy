import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, BookOpen, Target, Flame, Code } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileData {
  total_lessons_completed: number;
  total_points: number;
  current_streak: number;
  best_streak: number;
}

interface RecentBadge {
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentBadges, setRecentBadges] = useState<RecentBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchRecentBadges();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_lessons_completed, total_points, current_streak, best_streak')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRecentBadges = async () => {
    try {
      const { data, error } = await supabase
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
        .order('earned_at', { ascending: false })
        .limit(3);

      if (data) {
        const formattedBadges = data.map((item: any) => ({
          name: item.badges.name,
          description: item.badges.description,
          icon: item.badges.icon,
          earned_at: item.earned_at,
        }));
        setRecentBadges(formattedBadges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Ready to debug some code? Let's continue your journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_lessons_completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Keep going to unlock more challenges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground">
              Points earned from challenges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.current_streak || 0}</div>
            <p className="text-xs text-muted-foreground">
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
            <div className="text-2xl font-bold">{profile?.best_streak || 0}</div>
            <p className="text-xs text-muted-foreground">
              Your personal record
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump into coding or explore features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/challenge">
              <Button className="w-full justify-start">
                <Code className="mr-2 h-4 w-4" />
                Start Debugging Challenge
              </Button>
            </Link>
            <Link to="/learn">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Lessons
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                View Leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>
              Your latest earned badges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentBadges.length > 0 ? (
              <div className="space-y-4">
                {recentBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <p className="font-medium">{badge.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No badges earned yet</p>
                <p className="text-sm">Complete lessons to earn your first badge!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}