import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sanitizeInput } from '@/lib/sanitize';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updates = {
      image_url: data.image_url,
      title: data.title ? sanitizeInput(data.title) : null,
      description: data.description ? sanitizeInput(data.description) : null,
      link: data.link ? sanitizeInput(data.link) : null,
      sort_order: data.sort_order,
      active: data.active,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('carousel_images')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating carousel image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('carousel_images')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}