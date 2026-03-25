import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

export class UndoManager {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxHistory: number;
  private editor: CIVideoHotspotEditor;

  constructor(editor: CIVideoHotspotEditor, maxHistory = 50) {
    this.editor = editor;
    this.maxHistory = maxHistory;
  }

  push(): void {
    this.undoStack.push(JSON.stringify(this.editor.getHotspots()));
    this.redoStack = [];
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(JSON.stringify(this.editor.getHotspots()));
    const prev = this.undoStack.pop()!;
    this.editor.restoreSnapshot(JSON.parse(prev));
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(JSON.stringify(this.editor.getHotspots()));
    const next = this.redoStack.pop()!;
    this.editor.restoreSnapshot(JSON.parse(next));
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
