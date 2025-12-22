-- Add missing columns to media table
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS bucket_path TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS size_bytes BIGINT;

-- RLS Policies for Media
-- Enable RLS (just in case it wasn't)
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Media viewable by everyone" ON public.media 
FOR SELECT USING (true);

-- Allow authenticated users to upload their own media
CREATE POLICY "Users can upload own media" ON public.media 
FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media" ON public.media 
FOR DELETE USING (auth.uid() = uploader_id);
-- Add missing columns to media table
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS bucket_path TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS size_bytes BIGINT;

-- RLS Policies for Media
-- Enable RLS (just in case it wasn't)
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Media viewable by everyone" ON public.media 
FOR SELECT USING (true);

-- Allow authenticated users to upload their own media
CREATE POLICY "Users can upload own media" ON public.media 
FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media" ON public.media 
FOR DELETE USING (auth.uid() = uploader_id);