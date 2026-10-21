/** Thin wrapper over the DOM overlay declared in index.html. */
export class Hud {
  private readonly scoreEl: HTMLElement;
  private readonly livesEl: HTMLElement;
  private readonly messageEl: HTMLElement;
  private readonly messageTitle: HTMLElement;
  private readonly messageHint: HTMLElement;
  private readonly bossEl: HTMLElement;
  private readonly bossFill: HTMLElement;
  private readonly toastEl: HTMLElement;

  constructor(root: Document = document) {
    this.scoreEl = Hud.require(root, 'hud-score');
    this.livesEl = Hud.require(root, 'hud-lives');
    this.messageEl = Hud.require(root, 'hud-message');
    this.messageTitle = Hud.require(root, 'hud-message-title');
    this.messageHint = Hud.require(root, 'hud-message-hint');
    this.bossEl = Hud.require(root, 'hud-boss');
    this.bossFill = Hud.require(root, 'hud-boss-fill');
    this.toastEl = Hud.require(root, 'hud-toast');
  }

  setScore(score: number): void {
    this.scoreEl.textContent = String(score);
  }

  setLives(lives: number): void {
    // Render one cube glyph per remaining life.
    this.livesEl.textContent = lives > 0 ? '■ '.repeat(lives).trim() : '—';
  }

  setBossHp(hp: number, maxHp: number): void {
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    this.bossFill.style.width = `${ratio * 100}%`;
    this.bossEl.hidden = false;
  }

  hideBoss(): void {
    this.bossEl.hidden = true;
  }

  showToast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
  }

  hideToast(): void {
    this.toastEl.classList.remove('show');
  }

  showMessage(title: string, hint: string): void {
    this.messageTitle.textContent = title;
    this.messageHint.textContent = hint;
    this.messageEl.hidden = false;
  }

  hideMessage(): void {
    this.messageEl.hidden = true;
  }

  private static require(root: Document, id: string): HTMLElement {
    const el = root.getElementById(id);
    if (!el) {
      throw new Error(`HUD element #${id} is missing from the document`);
    }
    return el;
  }
}
