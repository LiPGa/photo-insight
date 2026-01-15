import { supabase, DbPhotoEntry } from './supabase';
import { PhotoEntry } from '../types';

// 将前端 PhotoEntry 转换为数据库格式
function toDbEntry(entry: PhotoEntry, userId: string): Omit<DbPhotoEntry, 'id' | 'created_at'> {
  return {
    user_id: userId,
    title: entry.title || null,
    image_url: entry.imageUrl,
    date: entry.date || null,
    location: entry.location || null,
    notes: entry.notes || null,
    tags: entry.tags || null,
    params: entry.params || null,
    scores: entry.scores,
    analysis: entry.analysis || null,
  };
}

// 将数据库格式转换为前端 PhotoEntry
function fromDbEntry(dbEntry: DbPhotoEntry): PhotoEntry {
  return {
    id: dbEntry.id,
    title: dbEntry.title || undefined,
    imageUrl: dbEntry.image_url,
    date: dbEntry.date || undefined,
    location: dbEntry.location || undefined,
    notes: dbEntry.notes || undefined,
    tags: dbEntry.tags || undefined,
    params: dbEntry.params || {},
    scores: dbEntry.scores,
    analysis: dbEntry.analysis || undefined,
  };
}

// 保存照片记录到 Supabase
export async function savePhotoEntry(entry: PhotoEntry, userId: string): Promise<PhotoEntry | null> {
  try {
    const dbEntry = toDbEntry(entry, userId);
    const { data, error } = await supabase
      .from('photo_entries')
      .insert(dbEntry)
      .select()
      .single();

    if (error) {
      console.error('Error saving photo entry:', error);
      return null;
    }

    return fromDbEntry(data);
  } catch (err) {
    console.error('Error saving photo entry:', err);
    return null;
  }
}

// 获取用户的所有照片记录
export async function getUserPhotoEntries(userId: string): Promise<PhotoEntry[]> {
  try {
    const { data, error } = await supabase
      .from('photo_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photo entries:', error);
      return [];
    }

    return (data || []).map(fromDbEntry);
  } catch (err) {
    console.error('Error fetching photo entries:', err);
    return [];
  }
}

// 删除照片记录
export async function deletePhotoEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('photo_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting photo entry:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting photo entry:', err);
    return false;
  }
}

// 更新使用统计
export async function updateUsageStats(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // 尝试更新今天的记录
    const { data: existing } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      // 更新已有记录
      await supabase
        .from('usage_stats')
        .update({ analysis_count: existing.analysis_count + 1 })
        .eq('id', existing.id);
    } else {
      // 创建新记录
      await supabase
        .from('usage_stats')
        .insert({
          user_id: userId,
          date: today,
          analysis_count: 1,
        });
    }
  } catch (err) {
    console.error('Error updating usage stats:', err);
  }
}

// 获取用户设置
export async function getUserSettings(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error fetching user settings:', err);
    return null;
  }
}

// 保存用户设置
export async function saveUserSettings(userId: string, settings: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving user settings:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error saving user settings:', err);
    return false;
  }
}
