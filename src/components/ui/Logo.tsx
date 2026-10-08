import {
  Sprout, Wallet, FileText, HardHat, Package, Beef, Shield, TrendingUp,
  Check, BarChart3, ScrollText, Bell, Users, Landmark, Receipt, Truck,
  FileBarChart, LayoutDashboard, Settings, AlertTriangle, Eye, Lock,
  Mail, ArrowRight, ArrowLeft, Plus, XCircle, Clock, PiggyBank, Menu, X,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Sprout, Wallet, FileText, HardHat, Package, Beef, Shield, TrendingUp,
  Check, BarChart3, ScrollText, Bell, Users, Landmark, Receipt, Truck,
  FileBarChart, LayoutDashboard, Settings, AlertTriangle, Eye, Lock,
  Mail, ArrowRight, ArrowLeft, Plus, XCircle, Clock, PiggyBank, Menu, X,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Sprout;
}

interface LogoProps {
  icon?: string;
  color?: string;
  bgColor?: string;
  size?: number;
  className?: string;
  imageUrl?: string | null;
}

export function Logo({ icon = 'Sprout', color = '#FFFFFF', bgColor = '#16A34A', size = 40, className = '', imageUrl }: LogoProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Logo"
        className={`rounded-xl object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const IconComp = getIcon(icon);
  return (
    <div
      className={`rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <IconComp size={Math.round(size * 0.55)} style={{ color }} />
    </div>
  );
}
