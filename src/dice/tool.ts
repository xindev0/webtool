import { t } from '../shared/i18n'
import { escapeHtml } from '../shared/utils'

export function renderDiceTool(container: HTMLElement) {
  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('dice.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('dice.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-card">
        <div class="wt-card__body">
          <div class="wt-row wt-row--wrap" style="align-items:end;gap:12px;">
            <label class="wt-label">
              ${escapeHtml(t('dice.count'))}
              <input class="wt-input" id="wt-dice-count" type="number" min="1" max="12" value="2" style="margin-top:6px;width:100px;" />
            </label>
            <label class="wt-label">
              ${escapeHtml(t('dice.sides'))}
              <select class="wt-select" id="wt-dice-sides" style="margin-top:6px;width:120px;">
                <option value="4">d4</option>
                <option value="6" selected>d6</option>
                <option value="8">d8</option>
                <option value="10">d10</option>
                <option value="12">d12</option>
                <option value="20">d20</option>
                <option value="100">d100</option>
              </select>
            </label>
            <button class="wt-button wt-button--primary" id="wt-dice-roll" type="button">${escapeHtml(t('dice.roll'))}</button>
          </div>
          <div id="wt-dice-values" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;"></div>
          <p id="wt-dice-total" style="font-size:1.2rem;font-weight:700;margin-top:16px;">${escapeHtml(t('dice.idle'))}</p>
        </div>
      </div>
    </section>
  `

  const countInput = container.querySelector<HTMLInputElement>('#wt-dice-count')!
  const sidesSelect = container.querySelector<HTMLSelectElement>('#wt-dice-sides')!
  const valuesEl = container.querySelector<HTMLElement>('#wt-dice-values')!
  const totalEl = container.querySelector<HTMLElement>('#wt-dice-total')!

  container.querySelector<HTMLButtonElement>('#wt-dice-roll')?.addEventListener('click', () => {
    const count = Math.min(12, Math.max(1, Number.parseInt(countInput.value, 10) || 1))
    const sides = Math.max(2, Number.parseInt(sidesSelect.value, 10) || 6)
    const values = Array.from({ length: count }, () => randomInt(sides) + 1)
    const total = values.reduce((sum, value) => sum + value, 0)
    valuesEl.innerHTML = values
      .map((value) => `<span class="wt-chip" style="font-size:1rem;padding:10px 14px;">${escapeHtml(String(value))}</span>`)
      .join('')
    totalEl.textContent = `${t('dice.total')}: ${total}`
  })
}

function randomInt(max: number): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % max
}
