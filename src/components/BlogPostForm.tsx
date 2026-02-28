'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface BlogPostFormProps {
  post?: any; // existing post for edit mode
  onSave: () => void;
  onCancel: () => void;
}

export default function BlogPostForm({ post, onSave, onCancel }: BlogPostFormProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image || '');
  const [published, setPublished] = useState(post?.published || false);
  const [loading, setLoading] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = post ? 'PUT' : 'POST';
      const url = post ? `/api/blog/${post.id}` : '/api/blog';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          featured_image: featuredImage,
          published,
        }),
      });

      if (!response.ok) throw new Error('Failed to save post');
      onSave();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {post ? 'Beitrag bearbeiten' : 'Neuen Beitrag erstellen'}
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500"
            />
            <p className="text-xs text-gray-500 mt-1">Wird in der URL verwendet: /blog/{slug}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kurzbeschreibung</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inhalt *</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">HTML erlaubt (einfach reinkopieren)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bild-URL</label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-xl">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-yellow-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Veröffentlicht (sofort sichtbar)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 road-sign py-3 font-semibold transition-all hover:scale-105 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Speichern
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 pro-card border-2 border-gray-300 py-3 font-semibold text-gray-700 rounded-xl hover:border-red-500"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}