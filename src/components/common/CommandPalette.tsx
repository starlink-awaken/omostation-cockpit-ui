/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useCallback } from 'react';
import './common.css';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // 忽略输入框中的快捷键
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT'
      || target.tagName === 'TEXTAREA'
      || target.tagName === 'SELECT'
      || target.tagName === 'OPTION'
      || target.tagName === 'BUTTON'
      || target.isContentEditable
    ) return;

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const metaMatch = shortcut.meta ? event.metaKey : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : true;
      const altMatch = shortcut.alt ? event.altKey : true;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  keywords?: string[];
  group?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  /** Pre-fill the search query when opening */
  initialQuery?: string;
}

export function CommandPalette({ isOpen, onClose, commands, initialQuery = '' }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.description && cmd.description.toLowerCase().includes(q)) ||
      (cmd.group && cmd.group.toLowerCase().includes(q)) ||
      (cmd.keywords && cmd.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette-header">
          <input
            type="text"
            className="command-palette-input"
            placeholder="输入命令..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div className="command-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              没有找到匹配的命令
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-item-label">
                  <span>{cmd.label}</span>
                  {cmd.group && (
                    <span className="command-item-group-tag" style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.6 }}>
                      [{cmd.group}]
                    </span>
                  )}
                </div>
                {cmd.description && (
                  <div className="command-item-description">{cmd.description}</div>
                )}
                {cmd.shortcut && (
                  <div className="command-item-shortcut">{cmd.shortcut}</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette(commands: CommandPaletteProps['commands']) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        ctrl: true,
        description: '打开命令面板',
        action: () => setIsOpen(prev => !prev),
      },
    ],
  });

  return {
    isOpen,
    initialQuery,
    open: () => setIsOpen(true),
    openWithQuery: (query: string) => {
      setInitialQuery(query);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
