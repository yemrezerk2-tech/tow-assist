import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Uploading file:', file.name, file.type, file.size);

    // Generate a unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${timestamp}.${ext}`;
    const filePath = `blog/${fileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filePath, buffer, {
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

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(filePath);

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