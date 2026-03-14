import { t } from '../shared/i18n'
import { escapeHtml } from '../shared/utils'

export function renderCoinTool(container: HTMLElement) {
  let heads = 0
  let tails = 0
  const history: string[] = []

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('coin.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('coin.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-card">
        <div class="wt-card__body">
          <div id="wt-coin-result" style="font-size:clamp(36px,8vw,72px);font-weight:700;text-align:center;padding:20px 0;">${escapeHtml(t('coin.idle'))}</div>
          <div class="wt-row wt-row--wrap wt-form__actions" style="justify-content:center;">
            <button class="wt-button wt-button--primary" id="wt-coin-flip" type="button">${escapeHtml(t('coin.flip'))}</button>
            <button class="wt-button wt-button--ghost" id="wt-coin-reset" type="button">${escapeHtml(t('coin.reset'))}</button>
          </div>
          <div class="wt-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-top:16px;">
            <div class="wt-card"><div class="wt-card__body"><h3 class="wt-card__title">${escapeHtml(t('coin.heads'))}</h3><p id="wt-coin-heads" class="wt-card__desc">0</p></div></div>
            <div class="wt-card"><div class="wt-card__body"><h3 class="wt-card__title">${escapeHtml(t('coin.tails'))}</h3><p id="wt-coin-tails" class="wt-card__desc">0</p></div></div>
          </div>
          <p id="wt-coin-history" class="wt-help" style="margin-top:16px;">${escapeHtml(t('coin.historyEmpty'))}</p>
        </div>
      </div>
    </section>
  `

  const resultEl = container.querySelector<HTMLElement>('#wt-coin-result')!
  const headsEl = container.querySelector<HTMLElement>('#wt-coin-heads')!
  const tailsEl = container.querySelector<HTMLElement>('#wt-coin-tails')!
  const historyEl = container.querySelector<HTMLElement>('#wt-coin-history')!

  const render = () => {
    headsEl.textContent = String(heads)
    tailsEl.textContent = String(tails)
    historyEl.textContent = history.length ? `${t('coin.history')}: ${history.join(', ')}` : t('coin.historyEmpty')
  }

  container.querySelector<HTMLButtonElement>('#wt-coin-flip')?.addEventListener('click', () => {
    const isHeads = randomInt(2) === 0
    const result = isHeads ? t('coin.heads') : t('coin.tails')
    if (isHeads) heads += 1
    else tails += 1
    history.unshift(result)
    history.splice(8)
    resultEl.textContent = result
    render()
  })

  container.querySelector<HTMLButtonElement>('#wt-coin-reset')?.addEventListener('click', () => {
    heads = 0
    tails = 0
    history.length = 0
    resultEl.textContent = t('coin.idle')
    render()
  })
}

function randomInt(max: number): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % max
}
