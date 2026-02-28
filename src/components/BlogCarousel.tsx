'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
}

export default function BlogCarousel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog?published=true')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load blog posts', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  // If only one post, just show it without controls
  if (posts.length === 1) {
    const post = posts[0];
    return (
      <div className="mt-16">
        <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Neueste vom Blog</h2>
        <Link
          href={`/blog/${post.slug}`}
          className="block pro-card rounded-2xl p-6 hover-lift group max-w-2xl mx-auto"
        >
          {post.featured_image && (
            <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
              <img
                src={post.featured_image}
                alt={post.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 mb-4">{post.excerpt}</p>
          <div className="text-sm text-yellow-600">
            {new Date(post.published_at!).toLocaleDateString('de-DE')}
          </div>
        </Link>
      </div>
    );
  }

  // Carousel for multiple posts
  const post = posts[currentIndex];

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Neueste vom Blog</h2>
      <div className="relative max-w-2xl mx-auto">
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white rounded-full p-2 shadow-lg hover:bg-yellow-50 z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white rounded-full p-2 shadow-lg hover:bg-yellow-50 z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <Link
          href={`/blog/${post.slug}`}
          className="block pro-card rounded-2xl p-6 hover-lift group"
        >
          {post.featured_image && (
            <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
              <img
                src={post.featured_image}
                alt={post.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 mb-4">{post.excerpt}</p>
          <div className="text-sm text-yellow-600">
            {new Date(post.published_at!).toLocaleDateString('de-DE')}
          </div>
        </Link>

        <div className="flex justify-center gap-2 mt-4">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}