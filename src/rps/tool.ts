import { t } from '../shared/i18n'
import { escapeHtml } from '../shared/utils'

const MOVES = ['rock', 'paper', 'scissors'] as const
type Move = (typeof MOVES)[number]

export function renderRpsTool(container: HTMLElement) {
  const history: string[] = []

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('rps.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('rps.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-card">
        <div class="wt-card__body">
          <div class="wt-row wt-row--wrap wt-form__actions" style="justify-content:center;">
            ${MOVES.map((move) => `<button class="wt-button wt-button--primary" data-move="${move}" type="button">${escapeHtml(t(`rps.${move}`))}</button>`).join('')}
            <button class="wt-button wt-button--ghost" id="wt-rps-random" type="button">${escapeHtml(t('rps.random'))}</button>
          </div>
          <div id="wt-rps-result" style="margin-top:20px;text-align:center;">
            <div style="font-size:1.2rem;font-weight:700;">${escapeHtml(t('rps.idle'))}</div>
            <p class="wt-help" id="wt-rps-detail"></p>
          </div>
          <p id="wt-rps-history" class="wt-help" style="margin-top:16px;">${escapeHtml(t('rps.historyEmpty'))}</p>
        </div>
      </div>
    </section>
  `

  const resultEl = container.querySelector<HTMLElement>('#wt-rps-result')!
  const detailEl = container.querySelector<HTMLElement>('#wt-rps-detail')!
  const historyEl = container.querySelector<HTMLElement>('#wt-rps-history')!

  const renderHistory = () => {
    historyEl.textContent = history.length ? `${t('rps.history')}: ${history.join(' | ')}` : t('rps.historyEmpty')
  }

  const play = (playerMove: Move) => {
    const computerMove = MOVES[randomInt(MOVES.length)]
    const outcome = decide(playerMove, computerMove)
    resultEl.firstElementChild!.textContent = t(`rps.${outcome}`)
    detailEl.textContent = `${t('rps.you')}: ${t(`rps.${playerMove}`)} | ${t('rps.computer')}: ${t(`rps.${computerMove}`)}`
    history.unshift(`${t(`rps.${playerMove}`)} / ${t(`rps.${computerMove}`)} / ${t(`rps.${outcome}`)}`)
    history.splice(8)
    renderHistory()
  }

  container.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
    button.addEventListener('click', () => {
      play(button.dataset.move as Move)
    })
  })
  container.querySelector<HTMLButtonElement>('#wt-rps-random')?.addEventListener('click', () => {
    play(MOVES[randomInt(MOVES.length)])
  })
}

function decide(player: Move, computer: Move): 'win' | 'lose' | 'draw' {
  if (player === computer) return 'draw'
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win'
  }
  return 'lose'
}

function randomInt(max: number): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % max
}
