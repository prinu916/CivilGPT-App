import { useEffect } from "react";

interface ShortcutProps {
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onEscape: () => void;
  hasSelected: boolean;
}

export function useKeyboardShortcuts({
  onDelete,
  onUndo,
  onRedo,
  onEscape,
  hasSelected,
}: ShortcutProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events when typing in inputs or textareas
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      // Escape key to deselect
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
      }

      // Delete key to remove selected element
      if (event.key === "Delete" || event.key === "Backspace") {
        if (hasSelected) {
          event.preventDefault();
          onDelete();
        }
      }

      // Undo: Ctrl+Z or Cmd+Z
      if (isCtrlOrMeta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      }

      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        (isCtrlOrMeta && event.key.toLowerCase() === "y") ||
        (isCtrlOrMeta && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDelete, onUndo, onRedo, onEscape, hasSelected]);
}
