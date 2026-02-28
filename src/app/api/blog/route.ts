import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeObject } from '@/lib/sanitize';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin') === 'true';
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });

    if (!admin) {
      query = query.eq('published', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const sanitized = sanitizeObject(data);

    // Generate slug from title if not provided
    const slug = sanitized.slug || sanitized.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newPost = {
      id: `BLOG${Date.now()}`,
      title: sanitized.title,
      slug,
      excerpt: sanitized.excerpt || null,
      content: sanitized.content,
      featured_image: sanitized.featured_image || null,
      published: sanitized.published || false,
      published_at: sanitized.published ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert([newPost])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}