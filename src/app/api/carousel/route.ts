import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const newImage = {
      id: `CAR${Date.now()}`,
      image_url: data.image_url,
      title: data.title ? sanitizeInput(data.title) : null,
      description: data.description ? sanitizeInput(data.description) : null,
      link: data.link ? sanitizeInput(data.link) : null,
      sort_order: data.sort_order || 0,
      active: true,
      created_at: new Date().toISOString(),
    };

    const { data: image, error } = await supabaseAdmin
      .from('carousel_images')
      .insert([newImage])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('Error creating carousel image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}