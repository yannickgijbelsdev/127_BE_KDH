import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { SidebarContent } from '../components/toolbox/Sidebar';
import { CommandPalette } from '../components/toolbox/CommandPalette';

const LOGO_127 = 'https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png';

const ToolboxLayout = () => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="toolbox-root relative min-h-screen text-white" data-testid="toolbox-root">
      {/* Solid dark-mode background */}
      <div className="fixed inset-0 -z-10 bg-[#0b0f19]" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white hover:bg-white/10 lg:hidden" data-testid="mobile-menu-btn" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto border-white/10 bg-[#0d1524] p-0 text-white">
              <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
                <img src={LOGO_127} alt="127" className="h-7 w-auto brightness-110" draggable="false" />
                <span className="text-sm font-medium text-white/70">Toolbox</span>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/tools" className="flex items-center gap-2.5" data-testid="toolbox-logo">
            <img src={LOGO_127} alt="127 Logo" className="h-8 w-auto brightness-110" draggable="false" />
            <span className="hidden text-sm font-medium text-white/70 sm:inline">Toolbox</span>
          </Link>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          data-testid="search-trigger"
          className="group flex w-full max-w-sm items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur transition-colors duration-150 hover:bg-white/20"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search tools…</span>
          <kbd className="hidden rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
        </button>

        <div className="flex items-center gap-2">
          <a href="/" className="text-sm text-white/60 transition-colors duration-150 hover:text-white" data-testid="back-to-site">127.be</a>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-black/20 backdrop-blur-sm lg:block" data-testid="desktop-sidebar">
          <SidebarContent />
        </aside>
        {/* Main content */}
        <main className="min-w-0 flex-1 px-5 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};

export default ToolboxLayout;
