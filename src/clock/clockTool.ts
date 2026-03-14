import { t } from '../shared/i18n'
import { escapeAttr, escapeHtml } from '../shared/utils'
import { FALLBACK_TIMEZONES } from './timezones'

type TimeSource = {
  id: string
  name: string
  url?: string
  backupUrl?: string
  isLocal?: boolean
  fetchTime: () => Promise<number>
}

type TimeSourceStatus = {
  latencyMs?: number
  offsetMs?: number
  syncedAt?: number
  error?: string
}

type WorldZoneElements = {
  article: HTMLElement
  time: HTMLElement
  date: HTMLElement
  favoriteBtn: HTMLButtonElement
}

const TIME_SOURCES: TimeSource[] = [
  {
    id: 'local',
    name: 'clock.localClock',
    isLocal: true,
    fetchTime: async () => Date.now(),
  },
  {
    id: 'timeapi',
    name: 'TimeAPI',
    url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
    backupUrl: 'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC',
    fetchTime: async () => {
      const endpoints = [
        'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
        'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC',
      ]

      let lastError: unknown = null
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(withCacheBust(endpoint), { cache: 'no-store' })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = await response.json()
          return Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds, data.milliSeconds)
        } catch (error) {
          lastError = error
        }
      }

      throw lastError instanceof Error ? lastError : new Error('TimeAPI unavailable')
    },
  },
  {
    id: 'postman',
    name: 'Postman Echo',
    url: 'https://postman-echo.com/time/object',
    fetchTime: async () => {
      const response = await fetch(withCacheBust('https://postman-echo.com/time/object'), { cache: 'no-store' })
      const data = await response.json()
      return Date.UTC(data.years, data.months, data.date, data.hours, data.minutes, data.seconds, data.milliseconds)
    },
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Trace',
    url: 'https://www.cloudflare.com/cdn-cgi/trace',
    fetchTime: async () => {
      const response = await fetch(withCacheBust('https://www.cloudflare.com/cdn-cgi/trace'), { cache: 'no-store' })
      const text = await response.text()
      const match = text.match(/ts=(\d+(?:\.\d+)?)/)
      if (!match) throw new Error('No timestamp in response')
      return Math.round(Number(match[1]) * 1000)
    },
  },
]

const SYSTEM_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const ISO_TIMEZONES = getSupportedTimezones()
const FAVORITE_STORAGE_KEY = 'webtool.clock.favorites'

export function renderClockTool(container: HTMLElement) {
  let selectedSourceId = TIME_SOURCES[0].id
  let sourceStatuses: Record<string, TimeSourceStatus> = {}
  let currentOffsetMs = 0
  let currentLatencyMs: number | null = null
  let currentSyncedAt: number | null = null
  let countdownTarget = ''
  let stopwatchElapsedMs = 0
  let stopwatchStartedAt: number | null = null
  let stopwatchLaps: string[] = []
  let displayTimezone = SYSTEM_TIMEZONE
  let favoriteTimezones = loadFavoriteTimezones()
  if (!favoriteTimezones.size) {
    favoriteTimezones = new Set(['UTC', SYSTEM_TIMEZONE])
  }
  const enabledTimezones = new Set<string>([...favoriteTimezones, 'America/New_York'])
  const worldZoneElements = new Map<string, WorldZoneElements>()

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('clock.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('clock.desc'))}</p>
    </section>

    <section class="wt-section">
      <div class="wt-card wt-card--static">
        <div class="wt-card__body">
          <div class="wt-section__header">
            <h2 class="wt-section__title">${escapeHtml(t('clock.serverTitle'))}</h2>
          </div>
          <div class="wt-row wt-row--wrap" style="align-items:end;gap:12px;">
            <label class="wt-label" style="min-width:220px;flex:1;">
              ${escapeHtml(t('clock.serverLabel'))}
              <select id="wt-clock-source" class="wt-select" style="margin-top:6px;">
                ${TIME_SOURCES.map((source) => `<option value="${escapeAttr(source.id)}">${escapeHtml(getSourceName(source))}</option>`).join('')}
              </select>
            </label>
            <button class="wt-button wt-button--primary" id="wt-clock-sync" type="button">${escapeHtml(t('clock.syncNow'))}</button>
            <button class="wt-button wt-button--ghost" id="wt-clock-detect" type="button">${escapeHtml(t('clock.detectLatency'))}</button>
          </div>
          <p class="wt-help" id="wt-clock-sync-status"></p>
          <div id="wt-clock-source-list" class="wt-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:16px;"></div>
        </div>
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-card wt-card--static">
        <div class="wt-card__body">
          <div class="wt-row wt-row--wrap" style="justify-content:space-between;align-items:center;gap:12px;">
            <div>
              <h2 class="wt-section__title">${escapeHtml(t('clock.displayTitle'))}</h2>
              <p class="wt-help" id="wt-clock-active-source"></p>
            </div>
            <button class="wt-button wt-button--ghost" id="wt-clock-fullscreen" type="button">${escapeHtml(t('clock.fullscreen'))}</button>
          </div>
          <label class="wt-label" style="display:block;max-width:320px;">
            ${escapeHtml(t('clock.displayTimezone'))}
            <select id="wt-clock-display-timezone" class="wt-select" style="margin-top:6px;">
              ${ISO_TIMEZONES.map((zone) => `<option value="${escapeAttr(zone)}" ${zone === displayTimezone ? 'selected' : ''}>${escapeHtml(formatTimezoneLabel(zone))}</option>`).join('')}
            </select>
          </label>
          <div id="wt-clock-display" class="wt-clock-display" style="padding:20px 0;text-align:center;">
            <div id="wt-clock-time" class="wt-clock-display__time">--:--:--</div>
            <div id="wt-clock-date" class="wt-muted wt-clock-display__date"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-card wt-card--static">
        <div class="wt-card__body">
          <div class="wt-section__header">
            <h2 class="wt-section__title">${escapeHtml(t('clock.countdownTitle'))}</h2>
          </div>
          <label class="wt-label">
            ${escapeHtml(t('clock.countdownLabel'))}
            <input class="wt-input" id="wt-clock-countdown-target" type="datetime-local" style="margin-top:6px;" />
          </label>
          <div id="wt-clock-countdown" style="margin-top:16px;font-size:clamp(28px,6vw,56px);font-weight:700;">--</div>
          <p class="wt-help" id="wt-clock-countdown-note">${escapeHtml(t('clock.countdownHint'))}</p>
        </div>
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-card wt-card--static">
        <div class="wt-card__body">
          <div class="wt-section__header">
            <h2 class="wt-section__title">${escapeHtml(t('clock.stopwatchTitle'))}</h2>
          </div>
          <div id="wt-clock-stopwatch" style="margin-top:4px;font-size:clamp(28px,6vw,56px);font-weight:700;">00:00:00.00</div>
          <p class="wt-help" id="wt-clock-stopwatch-note">${escapeHtml(t('clock.stopwatchIdle'))}</p>
          <div class="wt-row wt-row--wrap wt-form__actions">
            <button class="wt-button wt-button--primary" id="wt-clock-stopwatch-toggle" type="button">${escapeHtml(t('clock.stopwatchStart'))}</button>
            <button class="wt-button wt-button--ghost" id="wt-clock-stopwatch-lap" type="button">${escapeHtml(t('clock.stopwatchLap'))}</button>
            <button class="wt-button wt-button--ghost" id="wt-clock-stopwatch-reset" type="button">${escapeHtml(t('clock.stopwatchReset'))}</button>
          </div>
          <div style="margin-top:16px;">
            <p class="wt-label" style="margin-bottom:8px;">${escapeHtml(t('clock.stopwatchLaps'))}</p>
            <div id="wt-clock-stopwatch-laps" class="wt-help"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-card wt-card--static">
        <div class="wt-card__body">
          <div class="wt-section__header">
            <h2 class="wt-section__title">${escapeHtml(t('clock.timezoneTitle'))}</h2>
          </div>
          <div>
            <p class="wt-label" style="margin-bottom:8px;">${escapeHtml(t('clock.favoriteTitle'))}</p>
            <div class="wt-chips" id="wt-clock-favorites"></div>
          </div>
          <div class="wt-row wt-row--wrap" style="align-items:end;gap:12px;">
            <label class="wt-label" style="min-width:280px;flex:1;">
              ${escapeHtml(t('clock.timezoneSearchLabel'))}
              <input id="wt-clock-timezone-search" class="wt-input" list="wt-clock-timezone-options" type="text" placeholder="${escapeAttr(t('clock.timezoneSearchPlaceholder'))}" style="margin-top:6px;" />
              <datalist id="wt-clock-timezone-options">
                ${ISO_TIMEZONES.map((zone) => `<option value="${escapeAttr(zone)}">${escapeHtml(formatTimezoneLabel(zone))}</option>`).join('')}
              </datalist>
            </label>
            <button class="wt-button wt-button--ghost" id="wt-clock-add-timezone" type="button">${escapeHtml(t('clock.addTimezone'))}</button>
          </div>
          <div id="wt-clock-search-results" style="display:grid;gap:8px;margin-top:12px;"></div>
          <div class="wt-chips" id="wt-clock-timezones" style="margin-top:12px;"></div>
          <div id="wt-clock-world-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px;"></div>
        </div>
      </div>
    </section>
  `

  const sourceSelect = container.querySelector<HTMLSelectElement>('#wt-clock-source')!
  const syncBtn = container.querySelector<HTMLButtonElement>('#wt-clock-sync')!
  const detectBtn = container.querySelector<HTMLButtonElement>('#wt-clock-detect')!
  const syncStatus = container.querySelector<HTMLElement>('#wt-clock-sync-status')!
  const sourceList = container.querySelector<HTMLElement>('#wt-clock-source-list')!
  const activeSource = container.querySelector<HTMLElement>('#wt-clock-active-source')!
  const displayTimezoneSelect = container.querySelector<HTMLSelectElement>('#wt-clock-display-timezone')!
  const timeEl = container.querySelector<HTMLElement>('#wt-clock-time')!
  const dateEl = container.querySelector<HTMLElement>('#wt-clock-date')!
  const fullscreenBtn = container.querySelector<HTMLButtonElement>('#wt-clock-fullscreen')!
  const displayEl = container.querySelector<HTMLElement>('#wt-clock-display')!
  const countdownInput = container.querySelector<HTMLInputElement>('#wt-clock-countdown-target')!
  const countdownEl = container.querySelector<HTMLElement>('#wt-clock-countdown')!
  const countdownNote = container.querySelector<HTMLElement>('#wt-clock-countdown-note')!
  const stopwatchEl = container.querySelector<HTMLElement>('#wt-clock-stopwatch')!
  const stopwatchNote = container.querySelector<HTMLElement>('#wt-clock-stopwatch-note')!
  const stopwatchToggleBtn = container.querySelector<HTMLButtonElement>('#wt-clock-stopwatch-toggle')!
  const stopwatchLapBtn = container.querySelector<HTMLButtonElement>('#wt-clock-stopwatch-lap')!
  const stopwatchResetBtn = container.querySelector<HTMLButtonElement>('#wt-clock-stopwatch-reset')!
  const stopwatchLapsEl = container.querySelector<HTMLElement>('#wt-clock-stopwatch-laps')!
  const favoritesWrap = container.querySelector<HTMLElement>('#wt-clock-favorites')!
  const timezoneWrap = container.querySelector<HTMLElement>('#wt-clock-timezones')!
  const timezoneSearch = container.querySelector<HTMLInputElement>('#wt-clock-timezone-search')!
  const addTimezoneBtn = container.querySelector<HTMLButtonElement>('#wt-clock-add-timezone')!
  const searchResults = container.querySelector<HTMLElement>('#wt-clock-search-results')!
  const timezoneList = container.querySelector<HTMLElement>('#wt-clock-world-list')!

  sourceSelect.value = selectedSourceId
  displayTimezoneSelect.value = displayTimezone

  const renderSourceStatuses = () => {
    sourceList.innerHTML = TIME_SOURCES.map((source) => {
      const status = sourceStatuses[source.id]
      const latency = status?.latencyMs != null ? `${Math.round(status.latencyMs)} ms` : t('clock.notTested')
      const state = status?.error ? status.error : status?.syncedAt ? t('clock.serverReady') : t('clock.serverIdle')
      return `
        <article class="wt-card wt-card--static">
          <div class="wt-card__body">
            <h3 class="wt-card__title">${escapeHtml(getSourceName(source))}</h3>
            <p class="wt-url" title="${escapeAttr(source.url ?? t('clock.localClock'))}">${escapeHtml(source.url ?? t('clock.localClock'))}</p>
            ${source.backupUrl ? `<p class="wt-help wt-help--break" title="${escapeAttr(source.backupUrl)}">${escapeHtml(t('clock.backupSource'))}: ${escapeHtml(source.backupUrl)}</p>` : ''}
            <p class="wt-help">${escapeHtml(t('clock.latencyLabel'))}: ${escapeHtml(latency)}</p>
            <p class="wt-help">${escapeHtml(t('clock.statusLabel'))}: ${escapeHtml(state)}</p>
          </div>
        </article>
      `
    }).join('')
  }

  const renderTimezoneChips = () => {
    timezoneWrap.innerHTML = [...enabledTimezones]
      .sort((left, right) => left.localeCompare(right))
      .map(
        (zone) => `
          <label class="wt-chip" for="wt-clock-zone-${escapeAttr(zone)}">
            <input id="wt-clock-zone-${escapeAttr(zone)}" data-zone="${escapeAttr(zone)}" type="checkbox" checked />
            <span>${escapeHtml(formatTimezoneLabel(zone))}</span>
          </label>
        `,
      )
      .join('')
  }

  const renderFavoriteChips = () => {
    const favorites = [...favoriteTimezones].sort((left, right) => left.localeCompare(right))
    favoritesWrap.innerHTML = favorites.length
      ? favorites
          .map(
            (zone) => `
              <button class="wt-chip wt-clock-favorite-chip" data-zone="${escapeAttr(zone)}" type="button">
                <span>${escapeHtml(formatTimezoneLabel(zone))}</span>
              </button>
            `,
          )
          .join('')
      : `<span class="wt-help">${escapeHtml(t('clock.favoriteEmpty'))}</span>`
  }

  const renderSearchResults = () => {
    const query = timezoneSearch.value.trim().toLowerCase()
    if (!query) {
      searchResults.innerHTML = ''
      return
    }
    const matches = ISO_TIMEZONES.filter((zone) => {
      const label = formatTimezoneLabel(zone).toLowerCase()
      return zone.toLowerCase().includes(query) || label.includes(query)
    }).slice(0, 8)
    searchResults.innerHTML = matches.length
      ? matches
          .map(
            (zone) => `
              <button class="wt-button wt-button--ghost wt-clock-search-result" data-zone="${escapeAttr(zone)}" type="button" style="justify-content:flex-start;">
                ${escapeHtml(formatTimezoneLabel(zone))}
              </button>
            `,
          )
          .join('')
      : `<p class="wt-help">${escapeHtml(t('clock.searchResultsEmpty'))}</p>`
  }

  const renderWorldCards = () => {
    const zones = [...enabledTimezones].sort((left, right) => left.localeCompare(right))
    const existing = new Set(worldZoneElements.keys())

    for (const zone of zones) {
      existing.delete(zone)
      if (worldZoneElements.has(zone)) continue
      const article = document.createElement('article')
      article.className = 'wt-card wt-card--static'
      article.innerHTML = `
        <div class="wt-card__body">
          <div class="wt-row" style="justify-content:space-between;align-items:start;gap:8px;">
            <h3 class="wt-card__title" style="margin:0;">${escapeHtml(formatTimezoneLabel(zone))}</h3>
            <button class="wt-button wt-button--ghost wt-button--icon" data-action="favorite" data-zone="${escapeAttr(zone)}" type="button" title="${escapeAttr(t('clock.toggleFavorite'))}" aria-label="${escapeAttr(t('clock.toggleFavorite'))}">${escapeHtml(t('clock.favoriteShort'))}</button>
          </div>
          <div class="wt-clock-world__time" style="font-size:1.6rem;font-weight:700;">--:--:--</div>
          <p class="wt-card__desc">--</p>
        </div>
      `
      timezoneList.appendChild(article)
      worldZoneElements.set(zone, {
        article,
        time: article.querySelector('.wt-clock-world__time') as HTMLElement,
        date: article.querySelector('.wt-card__desc') as HTMLElement,
        favoriteBtn: article.querySelector('[data-action="favorite"]') as HTMLButtonElement,
      })
    }

    for (const zone of existing) {
      const elements = worldZoneElements.get(zone)
      elements?.article.remove()
      worldZoneElements.delete(zone)
    }

    if (!zones.length) {
      timezoneList.innerHTML = `<p class="wt-help">${escapeHtml(t('clock.noTimezones'))}</p>`
      worldZoneElements.clear()
      return
    }
  }

  const updateWorldTimes = () => {
    const now = new Date(Date.now() + currentOffsetMs)
    for (const [zone, elements] of worldZoneElements.entries()) {
      elements.time.textContent = new Intl.DateTimeFormat(undefined, {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
      elements.date.textContent = new Intl.DateTimeFormat(undefined, {
        timeZone: zone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'short',
      }).format(now)
      elements.favoriteBtn.classList.toggle('is-active', favoriteTimezones.has(zone))
      elements.favoriteBtn.textContent = favoriteTimezones.has(zone) ? t('clock.favoriteSaved') : t('clock.favoriteShort')
    }
  }

  const renderStopwatch = () => {
    const elapsedMs = getStopwatchElapsedMs(stopwatchElapsedMs, stopwatchStartedAt)
    stopwatchEl.textContent = formatStopwatchDuration(elapsedMs)
    stopwatchToggleBtn.textContent = stopwatchStartedAt == null ? t('clock.stopwatchStart') : t('clock.stopwatchPause')
    stopwatchLapBtn.disabled = elapsedMs === 0
    stopwatchResetBtn.disabled = elapsedMs === 0 && stopwatchLaps.length === 0
    stopwatchNote.textContent = stopwatchStartedAt == null ? t('clock.stopwatchIdle') : t('clock.stopwatchRunning')
    stopwatchLapsEl.innerHTML = stopwatchLaps.length
      ? stopwatchLaps.map((lap, index) => `<div>${escapeHtml(`${index + 1}. ${lap}`)}</div>`).join('')
      : `<span>${escapeHtml(t('clock.stopwatchLapsEmpty'))}</span>`
  }

  const renderClock = () => {
    const now = new Date(Date.now() + currentOffsetMs)
    timeEl.textContent = new Intl.DateTimeFormat(undefined, {
      timeZone: displayTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now)
    dateEl.textContent = new Intl.DateTimeFormat(undefined, {
      timeZone: displayTimezone,
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      weekday: 'long',
    }).format(now)

    const selectedSource = TIME_SOURCES.find((source) => source.id === selectedSourceId)
    const syncedText = currentSyncedAt ? new Date(currentSyncedAt).toLocaleTimeString() : t('clock.neverSynced')
    const latencyText = currentLatencyMs != null ? `${Math.round(currentLatencyMs)} ms` : '--'
    activeSource.textContent = `${t('clock.currentSource')}: ${selectedSource ? getSourceName(selectedSource) : t('clock.localClock')} | ${t('clock.displayTimezone')}: ${formatTimezoneLabel(displayTimezone)} | ${t('clock.latencyLabel')}: ${latencyText} | ${t('clock.lastSync')}: ${syncedText}`

    if (!countdownTarget) {
      countdownEl.textContent = '--'
      countdownNote.textContent = t('clock.countdownHint')
    } else {
      const remaining = new Date(countdownTarget).getTime() - now.getTime()
      if (!Number.isFinite(remaining)) {
        countdownEl.textContent = '--'
        countdownNote.textContent = t('clock.countdownInvalid')
      } else if (remaining <= 0) {
        countdownEl.textContent = t('clock.countdownDone')
        countdownNote.textContent = t('clock.countdownReached')
      } else {
        countdownEl.textContent = formatDuration(remaining)
        countdownNote.textContent = t('clock.countdownRunning')
      }
    }

    updateWorldTimes()
    renderStopwatch()
  }

  const setSyncMessage = (message: string, isError = false) => {
    syncStatus.textContent = message
    syncStatus.style.color = isError ? '#ef4444' : ''
  }

  const syncSource = async (sourceId: string) => {
    const source = TIME_SOURCES.find((item) => item.id === sourceId)
    if (!source) return
    setSyncMessage(t('clock.syncing'))

    const startedAt = performance.now()
    try {
      const serverMs = await source.fetchTime()
      const finishedAt = performance.now()
      const receivedAt = Date.now()
      const latencyMs = source.isLocal ? 0 : finishedAt - startedAt
      const offsetMs = source.isLocal ? 0 : serverMs + latencyMs / 2 - receivedAt
      sourceStatuses = {
        ...sourceStatuses,
        [source.id]: { latencyMs, offsetMs, syncedAt: receivedAt },
      }
      currentOffsetMs = offsetMs
      currentLatencyMs = latencyMs
      currentSyncedAt = receivedAt
      setSyncMessage(`${t('clock.syncSuccess')} ${getSourceName(source)}`)
      renderSourceStatuses()
      renderClock()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('clock.syncFailed')
      sourceStatuses = {
        ...sourceStatuses,
        [source.id]: { error: message, syncedAt: Date.now() },
      }
      setSyncMessage(`${t('clock.syncFailed')}: ${message}`, true)
      renderSourceStatuses()
    }
  }

  const detectAllLatencies = async () => {
    setSyncMessage(t('clock.detecting'))
    await Promise.all(
      TIME_SOURCES.map(async (source) => {
        const startedAt = performance.now()
        try {
          const serverMs = await source.fetchTime()
          const finishedAt = performance.now()
          const receivedAt = Date.now()
          const latencyMs = source.isLocal ? 0 : finishedAt - startedAt
          sourceStatuses = {
            ...sourceStatuses,
            [source.id]: {
              latencyMs,
              offsetMs: source.isLocal ? 0 : serverMs + latencyMs / 2 - receivedAt,
              syncedAt: receivedAt,
            },
          }
        } catch (error) {
          sourceStatuses = {
            ...sourceStatuses,
            [source.id]: {
              error: error instanceof Error ? error.message : t('clock.syncFailed'),
            },
          }
        }
      }),
    )
    renderSourceStatuses()
    setSyncMessage(t('clock.detectDone'))
  }

  const addTimezone = (value: string) => {
    if (!ISO_TIMEZONES.includes(value)) {
      setSyncMessage(t('clock.invalidTimezone'), true)
      return
    }
    enabledTimezones.add(value)
    renderTimezoneChips()
    renderWorldCards()
    updateWorldTimes()
    timezoneSearch.value = ''
    renderSearchResults()
  }

  const toggleFavorite = (zone: string) => {
    if (favoriteTimezones.has(zone)) favoriteTimezones.delete(zone)
    else favoriteTimezones.add(zone)
    persistFavoriteTimezones(favoriteTimezones)
    renderFavoriteChips()
    updateWorldTimes()
  }

  sourceSelect.addEventListener('change', () => {
    selectedSourceId = sourceSelect.value
    renderClock()
  })

  displayTimezoneSelect.addEventListener('change', () => {
    displayTimezone = displayTimezoneSelect.value
    renderClock()
  })

  syncBtn.addEventListener('click', () => {
    void syncSource(selectedSourceId)
  })

  detectBtn.addEventListener('click', () => {
    void detectAllLatencies()
  })

  fullscreenBtn.addEventListener('click', async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await displayEl.requestFullscreen()
  })

  countdownInput.addEventListener('input', () => {
    countdownTarget = countdownInput.value
    renderClock()
  })

  stopwatchToggleBtn.addEventListener('click', () => {
    if (stopwatchStartedAt == null) {
      stopwatchStartedAt = Date.now()
    } else {
      stopwatchElapsedMs = getStopwatchElapsedMs(stopwatchElapsedMs, stopwatchStartedAt)
      stopwatchStartedAt = null
    }
    renderClock()
  })

  stopwatchLapBtn.addEventListener('click', () => {
    const elapsedMs = getStopwatchElapsedMs(stopwatchElapsedMs, stopwatchStartedAt)
    if (elapsedMs === 0) return
    stopwatchLaps = [formatStopwatchDuration(elapsedMs), ...stopwatchLaps].slice(0, 12)
    renderClock()
  })

  stopwatchResetBtn.addEventListener('click', () => {
    stopwatchElapsedMs = 0
    stopwatchStartedAt = null
    stopwatchLaps = []
    renderClock()
  })

  timezoneWrap.addEventListener('change', (event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    const zone = target.dataset.zone
    if (!zone) return
    if (target.checked) enabledTimezones.add(zone)
    else enabledTimezones.delete(zone)
    renderTimezoneChips()
    renderWorldCards()
    updateWorldTimes()
  })

  favoritesWrap.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLElement>('[data-zone]')
    const zone = button?.dataset.zone
    if (!zone) return
    enabledTimezones.add(zone)
    displayTimezone = zone
    displayTimezoneSelect.value = zone
    renderTimezoneChips()
    renderWorldCards()
    renderClock()
  })

  timezoneList.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLElement>('[data-action="favorite"]')
    const zone = button?.dataset.zone
    if (!zone) return
    toggleFavorite(zone)
  })

  addTimezoneBtn.addEventListener('click', () => {
    addTimezone(timezoneSearch.value.trim())
  })

  timezoneSearch.addEventListener('input', renderSearchResults)

  timezoneSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTimezone(timezoneSearch.value.trim())
    }
  })

  searchResults.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLElement>('[data-zone]')
    const zone = button?.dataset.zone
    if (!zone) return
    addTimezone(zone)
  })

  renderSourceStatuses()
  renderFavoriteChips()
  renderTimezoneChips()
  renderWorldCards()
  renderClock()
  void syncSource(selectedSourceId)
  setInterval(renderClock, 100)
  setInterval(() => {
    void syncSource(selectedSourceId)
  }, 5 * 60 * 1000)
}

function getSupportedTimezones(): string[] {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const values = Intl.supportedValuesOf('timeZone')
      if (values.length) return values
    }
  } catch {}
  return [...FALLBACK_TIMEZONES]
}

function getSourceName(source: TimeSource): string {
  return source.name.startsWith('clock.') ? t(source.name) : source.name
}

function formatTimezoneLabel(zone: string): string {
  const offset = getTimezoneOffsetLabel(zone)
  const label = zone.replaceAll('_', ' ').replaceAll('/', ' / ')
  return offset ? `${offset} - ${label}` : label
}

function loadFavoriteTimezones(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITE_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string' && ISO_TIMEZONES.includes(value)))
  } catch {
    return new Set()
  }
}

function persistFavoriteTimezones(favorites: Set<string>) {
  try {
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify([...favorites].sort()))
  } catch {}
}

function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_=${Date.now()}`
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [days, hours, minutes, seconds]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, '0')))
    .join(':')
}

function getStopwatchElapsedMs(baseElapsedMs: number, startedAt: number | null): number {
  if (startedAt == null) return baseElapsedMs
  return baseElapsedMs + Math.max(0, Date.now() - startedAt)
}

function formatStopwatchDuration(ms: number): string {
  const totalCentiseconds = Math.floor(Math.max(0, ms) / 10)
  const hours = Math.floor(totalCentiseconds / 360000)
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000)
  const seconds = Math.floor((totalCentiseconds % 6000) / 100)
  const centiseconds = totalCentiseconds % 100
  return `${[hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')}.${String(centiseconds).padStart(2, '0')}`
}

function getTimezoneOffsetLabel(zone: string, referenceDate = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
    })
    const offsetPart = formatter.formatToParts(referenceDate).find((part) => part.type === 'timeZoneName')?.value
    if (!offsetPart) return ''
    if (offsetPart === 'GMT' || offsetPart === 'UTC') return 'UTC+00:00'

    const normalized = offsetPart.replace('GMT', 'UTC').replace('UTC', '')
    const match = normalized.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/)
    if (!match) return offsetPart.replace('GMT', 'UTC')

    const [, sign, hour, minute = '00'] = match
    return `UTC${sign}${hour.padStart(2, '0')}:${minute}`
  } catch {
    return ''
  }
}
