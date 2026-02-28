import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 3600;

async function getPost(slug: string) {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  return data;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; 
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 mb-8 pro-card border-2 border-gray-300 px-4 py-2 rounded-xl hover:border-yellow-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Blog
      </Link>

      <article className="max-w-3xl mx-auto">
{post.featured_image && (
  <div className="w-full max-h-96 bg-gray-100 rounded-xl mb-8 overflow-hidden flex items-center justify-center">
    <img
      src={post.featured_image}
      alt={post.title}
      className="max-h-full max-w-full object-contain"
    />
  </div>
)}

        <h1 className="text-4xl font-black text-gray-900 mb-4">{post.title}</h1>

        <div className="text-sm text-gray-500 mb-8">
          Veröffentlicht am{' '}
          {new Date(post.published_at).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

        <div className="prose prose-lg max-w-none">
          {post.content.split('\n').map((paragraph: string, i: number) => (
            <p key={i} className="mb-4">{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}