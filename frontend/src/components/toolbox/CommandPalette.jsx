import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { DialogTitle } from '../ui/dialog';
import { CATEGORIES, TOOLS } from '../../tools/registry';

export const CommandPalette = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        onOpenChange((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const go = (id) => { onOpenChange(false); navigate(`/tools/${id}`); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Search tools</DialogTitle>
      <CommandInput placeholder="Search tools…" data-testid="command-input" />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        {CATEGORIES.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat.id);
          return (
            <CommandGroup key={cat.id} heading={cat.name}>
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <CommandItem key={t.id} value={`${t.name} ${t.keywords.join(' ')}`} onSelect={() => go(t.id)} data-testid={`command-item-${t.id}`}>
                    <Icon className="text-muted-foreground" />
                    <span>{t.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};
