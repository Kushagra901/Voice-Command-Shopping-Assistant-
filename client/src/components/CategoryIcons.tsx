import React from "react";
import type { ItemCategory } from "@voice-shopping/shared";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function AppLogoIcon({ className = "w-6 h-6", size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path d="M4 8h16l-1.5 12h-13L4 8Z" stroke="url(#logo-grad)" strokeWidth="2" strokeLinejoin="round" fill="rgba(99, 102, 241, 0.15)" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13v2m3-4v6m3-4v2" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DairyIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Milk bottle & cheese */}
      <path d="M8 2h4v3H8z" />
      <path d="M7 5h6l1 3v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8l1-3Z" />
      <path d="M6 13h8" />
      <circle cx="10" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function ProduceIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Apple & Leaf */}
      <path d="M12 4c.5-1.5 2-2 3-2 0 1.5-.5 3-2 3.5" />
      <path d="M12 6c-2.5-2-6-1-7 2-1 3.5 0 7.5 2.5 10 1.8 1.8 3.5 2 4.5 2s2.7-.2 4.5-2c2.5-2.5 3.5-6.5 2.5-10-1-3-4.5-4-7-2Z" />
    </svg>
  );
}

export function BakeryIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Croissant / Bread loaf */}
      <path d="M3 13c0-3.5 4-6 9-6s9 2.5 9 6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" />
      <path d="M7 10l2 4M12 9v5M17 10l-2 4" />
    </svg>
  );
}

export function BeveragesIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Cup / Drink with straw */}
      <path d="M7 4h10l-1.5 15a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2L7 4Z" />
      <path d="M5 4h14" />
      <path d="M15 2l-2 4" />
    </svg>
  );
}

export function SnacksIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Cookie / Snack */}
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="15" r="1" fill="currentColor" />
      <circle cx="14" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

export function HouseholdIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Spray bottle / Clean */}
      <path d="M7 11V6a2 2 0 0 1 2-2h2v4" />
      <path d="M11 4h3l2 2v2h-5" />
      <path d="M9 11h6l1 10H8l1-10Z" />
      <path d="M19 6l2 2" />
    </svg>
  );
}

export function PersonalCareIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Sparkle / Lotion bottle */}
      <path d="M10 2h4v3h-4z" />
      <path d="M8 5h8a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="2" />
    </svg>
  );
}

export function OtherIcon({ className = "w-5 h-5", size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Tag / Box */}
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
    </svg>
  );
}

export function CategoryIcon({ category, className = "w-5 h-5", size = 20 }: { category: ItemCategory; className?: string; size?: number }) {
  switch (category) {
    case "Dairy":
      return <DairyIcon className={className} size={size} />;
    case "Produce":
      return <ProduceIcon className={className} size={size} />;
    case "Bakery":
      return <BakeryIcon className={className} size={size} />;
    case "Beverages":
      return <BeveragesIcon className={className} size={size} />;
    case "Snacks":
      return <SnacksIcon className={className} size={size} />;
    case "Household":
      return <HouseholdIcon className={className} size={size} />;
    case "Personal Care":
      return <PersonalCareIcon className={className} size={size} />;
    case "Other":
    default:
      return <OtherIcon className={className} size={size} />;
  }
}
