import type { ComponentPropsWithoutRef, ReactElement } from "react";

declare module "lucide-react" {
  export interface LucideProps extends ComponentPropsWithoutRef<"svg"> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  export type LucideIcon = (props: LucideProps) => ReactElement | null;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Apple: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowRightLeft: LucideIcon;
  export const Bell: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Clock: LucideIcon;
  export const Coffee: LucideIcon;
  export const Command: LucideIcon;
  export const Cookie: LucideIcon;
  export const CornerDownLeft: LucideIcon;
  export const Database: LucideIcon;
  export const Edit3: LucideIcon;
  export const Eye: LucideIcon;
  export const Filter: LucideIcon;
  export const Flame: LucideIcon;
  export const Globe: LucideIcon;
  export const Hash: LucideIcon;
  export const Heart: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const History: LucideIcon;
  export const Home: LucideIcon;
  export const Info: LucideIcon;
  export const Keyboard: LucideIcon;
  export const Languages: LucideIcon;
  export const Layers: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const ListChecks: LucideIcon;
  export const ListOrdered: LucideIcon;
  export const Mic: LucideIcon;
  export const MicOff: LucideIcon;
  export const Milk: LucideIcon;
  export const Minus: LucideIcon;
  export const Package: LucideIcon;
  export const Plus: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Repeat: LucideIcon;
  export const Rocket: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const Settings: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Sparkle: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const Sun: LucideIcon;
  export const Tag: LucideIcon;
  export const Trash2: LucideIcon;
  export const Type: LucideIcon;
  export const User: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const WifiOff: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;

  export const icons: Record<string, LucideIcon>;
}
