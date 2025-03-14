
import React from 'react';
import { Sparkles, Camera, Film, Download, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 fixed top-0 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="font-display font-bold text-xl">StoryVision</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="#script" icon={<Film className="h-4 w-4" />} label="Script" />
          <NavLink href="#characters" icon={<Camera className="h-4 w-4" />} label="Characters" />
          <NavLink href="#storyboard" icon={<Film className="h-4 w-4" />} label="Storyboard" />
          <NavLink href="#export" icon={<Download className="h-4 w-4" />} label="Export" />
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="default" className="hidden sm:flex button-shine">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-sm">
              <div className="flex flex-col gap-6 mt-12">
                <MobileNavLink 
                  href="#script" 
                  icon={<Film className="h-5 w-5" />} 
                  label="Script" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                />
                <MobileNavLink 
                  href="#characters" 
                  icon={<Camera className="h-5 w-5" />} 
                  label="Characters" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                />
                <MobileNavLink 
                  href="#storyboard" 
                  icon={<Film className="h-5 w-5" />} 
                  label="Storyboard" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                />
                <MobileNavLink 
                  href="#export" 
                  icon={<Download className="h-5 w-5" />} 
                  label="Export" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, label }) => {
  return (
    <a 
      href={href}
      className="flex items-center text-sm gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-1 py-2"
    >
      {icon}
      {label}
    </a>
  );
};

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ href, icon, label, onClick }) => {
  return (
    <a 
      href={href}
      className="flex items-center text-lg gap-3 text-muted-foreground hover:text-foreground transition-colors p-2"
      onClick={onClick}
    >
      {icon}
      {label}
    </a>
  );
};

export default Header;
