-- Create enum types for the application
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE programming_language AS ENUM ('python', 'javascript', 'java', 'cpp', 'go', 'rust');
CREATE TYPE badge_type AS ENUM ('first_debug', 'consecutive_solves', 'language_master', 'speed_demon', 'accuracy_ace');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  total_lessons_completed INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  language programming_language NOT NULL,
  difficulty difficulty_level NOT NULL,
  description TEXT NOT NULL,
  starter_code TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  hints TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table to track lesson completion
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken INTEGER, -- in seconds
  attempts INTEGER DEFAULT 1,
  hints_used INTEGER DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_type badge_type NOT NULL,
  icon TEXT,
  requirement_value INTEGER, -- e.g., 10 for "10 consecutive solves"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for lessons (publicly readable)
CREATE POLICY "Anyone can view lessons" ON public.lessons
  FOR SELECT USING (true);

-- Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for badges (publicly readable)
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- Create RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view all user badges for leaderboard" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample lessons
INSERT INTO public.lessons (title, language, difficulty, description, starter_code, expected_output, hints, points, order_index) VALUES
-- Python lessons
('Off-by-One Error in Loop', 'python', 'easy', 'Fix the loop so it prints numbers 1 through 5, not 1 through 6.', 'for i in range(1, 7):
    print(i)', '1
2
3
4
5', ARRAY['Check the upper bound of Python''s range function.', 'Remember that the stop value in range() is exclusive.'], 10, 1),

('Variable Scope Issue', 'python', 'medium', 'Fix the function so it correctly returns the doubled value.', 'def double_number(x):
    result = x * 2
def get_result():
    return result

print(get_result())', '20', ARRAY['Look at where variables are defined.', 'Functions have their own scope.', 'The result variable is not accessible outside the function.'], 15, 2),

-- JavaScript lessons
('Equality vs Identity', 'javascript', 'easy', 'Fix the comparison to work correctly with the number 5.', 'function checkNumber(num) {
    if (num === "5") {
        return "Number is five";
    }
    return "Number is not five";
}

console.log(checkNumber(5));', 'Number is five', ARRAY['Check the data types being compared.', 'Use == for loose equality or convert types.'], 10, 3),

('Async Function Issue', 'javascript', 'hard', 'Fix the function to properly wait for the async operation.', 'async function fetchData() {
    return new Promise(resolve => {
        setTimeout(() => resolve("Data loaded"), 1000);
    });
}

function displayData() {
    const data = fetchData();
    console.log(data);
}

displayData();', 'Data loaded', ARRAY['The function needs to wait for the Promise.', 'Use await keyword.', 'Make the calling function async too.'], 25, 4),

-- Java lessons
('Array Index Error', 'java', 'easy', 'Fix the array access to prevent index out of bounds.', 'public class Main {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        for (int i = 0; i <= numbers.length; i++) {
            System.out.println(numbers[i]);
        }
    }
}', '1
2
3
4
5', ARRAY['Check the loop condition.', 'Array indices start at 0 and end at length-1.'], 10, 5),

-- C++ lessons
('Memory Leak', 'cpp', 'hard', 'Fix the memory management issue.', '#include <iostream>
using namespace std;

int main() {
    int* ptr = new int(42);
    cout << *ptr << endl;
    return 0;
}', '42', ARRAY['Allocated memory should be freed.', 'Use delete to free memory.'], 25, 6);

-- Insert sample badges
INSERT INTO public.badges (name, description, badge_type, icon, requirement_value) VALUES
('First Debug', 'Complete your first debugging challenge', 'first_debug', '🐛', 1),
('Streak Master', 'Solve 10 challenges in a row', 'consecutive_solves', '🔥', 10),
('Python Expert', 'Master all Python challenges', 'language_master', '🐍', 10),
('Speed Demon', 'Solve a challenge in under 30 seconds', 'speed_demon', '⚡', 30),
('Accuracy Ace', 'Solve 5 challenges without using hints', 'accuracy_ace', '🎯', 5);