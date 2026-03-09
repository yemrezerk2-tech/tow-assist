'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CarouselImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  link: string | null;
}

export default function LandingCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    fetch('/api/carousel')
      .then(res => res.json())
      .then(data => {
        setImages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load carousel images', err);
        setLoading(false);
      });
  }, []);

  const nextSlide = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setFadeIn(true);
    }, 500);
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [images.length, currentIndex]);

  if (loading) {
    return <div className="w-full max-w-5xl mx-auto h-96 bg-gray-200 animate-pulse rounded-2xl"></div>;
  }

  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    const image = images[0];
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
          <img
            src={image.image_url}
            alt={image.title || 'Carousel image'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          {(image.title || image.description) && (
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              {image.title && <h3 className="text-2xl font-bold mb-2">{image.title}</h3>}
              {image.description && <p className="text-white/90">{image.description}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const Content = () => (
    <>
      {currentImage.title && (
        <h3 className="text-2xl font-bold text-white mb-2">{currentImage.title}</h3>
      )}
      {currentImage.description && (
        <p className="text-white/90 mb-4">{currentImage.description}</p>
      )}
    </>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
        {/* Image with fade transition */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={currentImage.image_url}
            alt={currentImage.title || 'Carousel image'}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          {currentImage.link ? (
            <Link href={currentImage.link}>
              <Content />
            </Link>
          ) : (
            <Content />
          )}
        </div>


      </div>
    </div>
  );
}