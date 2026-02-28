import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FileText } from 'lucide-react';
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // revalidate every hour

async function getPosts() {
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });
  return data || [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black text-gray-900 mb-8">Blog</h1>
      {posts.length === 0 ? (
        <div className="text-center pro-card rounded-2xl p-12 border-4 border-gray-400">
          <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Noch keine Blog Beiträge</h3>
          <p className="text-gray-600">Schau bald wieder vorbei!</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="pro-card rounded-2xl p-6 hover-lift group">
              {post.featured_image && (
  <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
    <img
      src={post.featured_image}
      alt={post.title}
      className="max-h-full max-w-full object-contain"
    />
  </div>
)}
             
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="text-sm text-yellow-600">
                {new Date(post.published_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}