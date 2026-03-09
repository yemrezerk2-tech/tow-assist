import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Uploading carousel image:', file.name, file.type, file.size);

    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `carousel/${timestamp}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabaseAdmin.storage
      .from('blog-images') // Reuse the same bucket
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error.message 
      }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log('Upload successful, URL:', urlData.publicUrl);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 });
  }
}