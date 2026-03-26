import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';
import type { EditorMode } from './types';

export class EditorToolbar {
  private editor: CIVideoHotspotEditor;
  private topBarEl: HTMLElement;
  private urlInput!: HTMLInputElement;
  private loadBtn!: HTMLElement;
  private demoMode: boolean;

  constructor(topBarEl: HTMLElement, editor: CIVideoHotspotEditor, demoMode = false) {
    this.editor = editor;
    this.topBarEl = topBarEl;
    this.demoMode = demoMode;
    this.setup();
  }

  private setup(): void {
    this.urlInput = this.topBarEl.querySelector('#video-url-input') as HTMLInputElement;
    this.loadBtn = this.topBarEl.querySelector('#video-url-load') as HTMLElement;

    // Demo mode: hide video URL bar and import button
    if (this.demoMode) {
      const urlBar = this.topBarEl.querySelector('#video-url-bar') as HTMLElement;
      if (urlBar) urlBar.style.display = 'none';
      const importLabel = this.topBarEl.querySelector('.toolbar-load-btn') as HTMLElement;
      if (importLabel) importLabel.style.display = 'none';
    }

    // Load video URL
    const loadVideo = () => {
      if (this.demoMode) return;
      const url = this.urlInput.value.trim();
      if (!url) return;
      this.editor.loadVideo(url);
    };
    this.loadBtn?.addEventListener('click', loadVideo);
    this.urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadVideo();
    });

    // Import
    const importInput = this.topBarEl.querySelector('#toolbar-import-file') as HTMLInputElement;
    importInput?.addEventListener('change', () => {
      const file = importInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (Array.isArray(data)) {
            this.editor.importHotspots(data);
          }
        } catch { /* ignore bad JSON */ }
        importInput.value = '';
      };
      reader.readAsText(file);
    });

    // Export
    this.topBarEl.querySelector('#toolbar-export')?.addEventListener('click', () => {
      const json = JSON.stringify(this.editor.getHotspots(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hotspots.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // Copy JSON
    this.topBarEl.querySelector('#toolbar-copy')?.addEventListener('click', () => {
      const json = JSON.stringify(this.editor.getHotspots(), null, 2);
      navigator.clipboard.writeText(json).then(() => {
        const btn = this.topBarEl.querySelector('#toolbar-copy')!;
        btn.classList.add('toolbar-btn--done');
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => {
          btn.classList.remove('toolbar-btn--done');
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy JSON';
        }, 2000);
      });
    });

    // Mode toggle
    this.topBarEl.querySelectorAll('#mode-toggle-bar').forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.mode-btn') as HTMLElement;
        if (!btn) return;
        const newMode = btn.dataset.mode as EditorMode;
        if (newMode && newMode !== this.editor.getMode()) {
          this.editor.setMode(newMode);
        }
      });
    });
  }

  setVideoUrl(url: string): void {
    if (this.urlInput) this.urlInput.value = url;
  }

  setLoadingState(loading: boolean): void {
    if (this.loadBtn) {
      this.loadBtn.textContent = loading ? 'Loading…' : 'Load';
      if (loading) {
        this.loadBtn.setAttribute('disabled', '');
      } else {
        this.loadBtn.removeAttribute('disabled');
      }
    }
  }

  showUrlError(): void {
    this.urlInput.style.borderColor = '#ef4444';
    this.urlInput.placeholder = 'Video failed to load — check the URL';
    setTimeout(() => {
      this.urlInput.style.borderColor = '';
      this.urlInput.placeholder = 'Video URL (mp4, webm, m3u8, YouTube, Vimeo...)';
    }, 3000);
  }
}
