-- =============================================
-- PhotoPath Supabase 数据库设置
-- 在 Supabase Dashboard → SQL Editor 中运行
-- =============================================

-- 1. 用户照片记录表
CREATE TABLE photo_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  date TEXT,
  location TEXT,
  notes TEXT,
  tags TEXT[],
  params JSONB,
  scores JSONB NOT NULL,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用户设置表
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'zh',
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 使用统计表
CREATE TABLE usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  analysis_count INT DEFAULT 0,
  UNIQUE(user_id, date)
);

-- =============================================
-- 行级安全策略 (RLS) - 确保用户只能访问自己的数据
-- =============================================

ALTER TABLE photo_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own photo_entries" ON photo_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own usage_stats" ON usage_stats
  FOR ALL USING (auth.uid() = user_id);
