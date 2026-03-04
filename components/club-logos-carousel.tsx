"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// Placeholder logos - you can replace these with actual club logo URLs
const clubLogos = [
  { id: 1, name: "Tech Club", logo: "/hero-campus.png" },
  { id: 2, name: "Drama Club", logo: "/hero-event.png" },
  { id: 3, name: "Music Club", logo: "/hero-students.png" },
  { id: 4, name: "Sports Club", logo: "/hero-campus.png" },
  { id: 5, name: "Art Club", logo: "/hero-event.png" },
  { id: 6, name: "Debate Club", logo: "/hero-students.png" },
  { id: 7, name: "Science Club", logo: "/hero-campus.png" },
  { id: 8, name: "Photography Club", logo: "/hero-event.png" },
  { id: 9, name: "Dance Club", logo: "/hero-students.png" },
  { id: 10, name: "Reading Club", logo: "/hero-campus.png" },
  { id: 11, name: "Volunteer Club", logo: "/hero-event.png" },
  { id: 12, name: "Business Club", logo: "/hero-students.png" },
  { id: 13, name: "Chess Club", logo: "/hero-campus.png" },
  { id: 14, name: "Robotics Club", logo: "/hero-event.png" },
  { id: 15, name: "Media Club", logo: "/hero-students.png" },
];

interface ClubLogosCarouselProps {
  logos?: { id: number; name: string; logo: string }[];
}

export function ClubLogosCarousel({
  logos = clubLogos,
}: ClubLogosCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const visibleLogos = 3;

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % logos.length);

    // Pause after slide, then allow next slide
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [logos.length, isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + logos.length) % logos.length);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [logos.length, isAnimating]);

  useEffect(() => {
    if (isPaused || isAnimating) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, isAnimating, nextSlide]);

  const getVisibleLogos = () => {
    const result = [];
    for (let i = 0; i < visibleLogos; i++) {
      const index = (currentIndex + i) % logos.length;
      result.push(logos[index]);
    }
    return result;
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main carousel container */}
      <div className="flex items-center justify-center gap-6 md:gap-10 py-10 px-16">
        {getVisibleLogos().map((club, idx) => (
          <div
            key={`${club.id}-${idx}`}
            className={`flex-shrink-0 transition-all duration-500 ${isAnimating ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"}`}
            style={{
              transitionDelay: `${idx * 100}ms`,
            }}
          >
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden bg-white shadow-lg border-2 border-gray-100 hover:border-[var(--aau-blue)] transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <Image
                src={club.logo}
                alt={club.name}
                fill
                className="object-cover"
                priority={idx === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        disabled={isAnimating}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-[var(--aau-blue)] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
        aria-label="Previous"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        disabled={isAnimating}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-[var(--aau-blue)] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
        aria-label="Next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
}
