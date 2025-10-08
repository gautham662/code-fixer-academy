import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, BarChart3, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LeaderboardUser {
  user_id: string;
  username: string;
  total_points: number;
  total_lessons_completed: number;
  current_streak: number;
  rank: number;
}

interface UserStats {
  completedByLanguage: { language: string; count: number }[];
  completedByDifficulty: { difficulty: string; count: number; color: string }[];
  progressOverTime: { date: string; lessons: number }[];
  accuracyStats: { metric: string; value: number }[];
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  useEffect(() => {
    fetchLeaderboard();
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, total_points, total_lessons_completed, current_streak')
        .order('total_points', { ascending: false })
        .limit(50);

      if (data) {
        const rankedData = data.map((profile, index) => ({
          ...profile,
          rank: index + 1,
        }));
        setLeaderboard(rankedData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch user progress with lesson details
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          *,
          lessons (
            language,
            difficulty
          )
        `)
        .eq('user_id', user.id);

      if (progressData) {
        // Group by language
        const languageCounts: Record<string, number> = {};
        const difficultyCounts: Record<string, number> = {};
        const dateMap: Record<string, number> = {};
        let totalAttempts = 0;
        let totalHints = 0;

        progressData.forEach((progress: any) => {
          const lesson = progress.lessons;
          if (lesson) {
            languageCounts[lesson.language] = (languageCounts[lesson.language] || 0) + 1;
            difficultyCounts[lesson.difficulty] = (difficultyCounts[lesson.difficulty] || 0) + 1;
          }
          
          const date = new Date(progress.completed_at).toLocaleDateString();
          dateMap[date] = (dateMap[date] || 0) + 1;
          
          totalAttempts += progress.attempts || 0;
          totalHints += progress.hints_used || 0;
        });

        const completedByLanguage = Object.entries(languageCounts).map(([language, count]) => ({
          language: language.charAt(0).toUpperCase() + language.slice(1),
          count,
        }));

        const difficultyColors: Record<string, string> = {
          easy: '#10b981',
          medium: '#f59e0b',
          hard: '#f97316',
          expert: '#ef4444',
        };

        const completedByDifficulty = Object.entries(difficultyCounts).map(([difficulty, count]) => ({
          difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
          count,
          color: difficultyColors[difficulty] || '#6366f1',
        }));

        const progressOverTime = Object.entries(dateMap)
          .map(([date, lessons]) => ({ date, lessons }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-7); // Last 7 days

        const avgAttempts = progressData.length > 0 ? (totalAttempts / progressData.length).toFixed(1) : '0';
        const avgHints = progressData.length > 0 ? (totalHints / progressData.length).toFixed(1) : '0';

        const accuracyStats = [
          { metric: 'Avg Attempts', value: parseFloat(avgAttempts) },
          { metric: 'Avg Hints', value: parseFloat(avgHints) },
          { metric: 'Total Solved', value: progressData.length },
        ];

        setUserStats({
          completedByLanguage,
          completedByDifficulty,
          progressOverTime,
          accuracyStats,
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard & Statistics</h1>
        <p className="text-muted-foreground">
          See how you rank and track your progress
        </p>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="stats" disabled={!user}>
            <BarChart3 className="h-4 w-4 mr-2" />
            My Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Debuggers</CardTitle>
              <CardDescription>
                Global rankings based on total points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((profile) => (
                  <div
                    key={profile.user_id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      profile.user_id === user?.id ? 'bg-primary/5 border-primary' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center">
                        {getRankIcon(profile.rank)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {profile.username || 'Anonymous User'}
                          {profile.user_id === user?.id && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {profile.total_lessons_completed} challenges completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{profile.total_points}</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rankings yet. Be the first to complete a challenge!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {userStats && (
            <>
              <div className="flex gap-2 justify-end">
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'pie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('pie')}
                >
                  <Target className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Challenges by Language</CardTitle>
                    <CardDescription>Your progress across different languages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartType === 'bar' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userStats.completedByLanguage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="language" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {chartType === 'line' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userStats.completedByLanguage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="language" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {chartType === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={userStats.completedByLanguage}
                            dataKey="count"
                            nameKey="language"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="hsl(var(--primary))"
                            label
                          >
                            {userStats.completedByLanguage.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Challenges by Difficulty</CardTitle>
                    <CardDescription>Breakdown of completed difficulty levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={userStats.completedByDifficulty}
                          dataKey="count"
                          nameKey="difficulty"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {userStats.completedByDifficulty.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress Over Time</CardTitle>
                    <CardDescription>Your recent activity (last 7 days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userStats.progressOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="lessons" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Your debugging efficiency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userStats.accuracyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
