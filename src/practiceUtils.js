import { TEAM_DURATION_MINUTES } from './constants'
import { timeToMinutes } from './dateUtils'

// Learn to Play is the one practice that is never hidden by a rink event
// (tournament / on-ice event) - it runs regardless, and both are shown.
export const LEARN_TO_PLAY = 'Learn to Play'

const DEFAULT_PRACTICE_MINUTES = 60
const DEFAULT_GAME_MINUTES = 60

// Which teams a practice is for. Newer practices carry a `teams` list
// (empty = open to everyone / rink-wide, e.g. Open Hockey); older single-
// team practices only have `team`.
export function practiceTeams(p) {
  if (p.teams && p.teams.length > 0) return p.teams
  return p.team ? [p.team] : []
}

export function practiceTitle(p) {
  return p.title || p.team || 'Practice'
}

// [startMinutes, endMinutes) or null if the practice has no start time.
export function practiceInterval(p) {
  const start = timeToMinutes(p.time)
  if (start == null) return null
  const end = p.end_time ? timeToMinutes(p.end_time) : null
  return [start, end != null && end > start ? end : start + DEFAULT_PRACTICE_MINUTES]
}

export function gameInterval(g) {
  const start = timeToMinutes(g.time)
  if (start == null) return null
  return [start, start + (TEAM_DURATION_MINUTES[g.team] || DEFAULT_GAME_MINUTES)]
}

export const intervalsOverlap = (a, b) => a[0] < b[1] && b[0] < a[1]

// Is this time window on `dateKey` taken over by a tournament or on-ice
// event? (`tournaments`/`onIce` are already limited to that day.)
function coveredByRinkEvent(interval, dateKey, tournaments, onIce) {
  const byTournament = tournaments.some((t) => {
    if (t.all_day) return true
    const endDate = t.end_date || t.date
    if (dateKey !== t.date && dateKey !== endDate) return true
    const tStart = t.time ? timeToMinutes(t.time) : null
    const tEnd = t.end_time ? timeToMinutes(t.end_time) : null
    if (dateKey === t.date && tStart != null && interval[1] <= tStart) return false
    if (dateKey === endDate && tEnd != null && interval[0] >= tEnd) return false
    return true
  })
  if (byTournament) return true
  return onIce.some((t) => {
    if (t.all_day) return true
    const tStart = t.time ? timeToMinutes(t.time) : null
    const tEnd = t.end_time ? timeToMinutes(t.end_time) : null
    if (tStart == null || tEnd == null) return true
    return intervalsOverlap(interval, [tStart, tEnd])
  })
}

// Works out, for one day, what happens to each practice:
//  - rink events (tournament / on-ice) hide every practice except Learn to Play
//  - a home game on top of a practice hides it too (except Learn to Play)
//  - an away game only conflicts if the practice is for that game's team
//  - conflicts (game + practice overlapping) are listed whenever the practice
//    isn't already wiped out by a rink event
// Returns Map(practiceId -> { hidden, conflicts: [game] }).
export function analyzeDayPractices(dateKey, practices, games, tournaments, onIce) {
  const info = new Map()
  practices.forEach((p) => {
    const pi = practiceInterval(p)
    if (!pi) {
      info.set(p.id, { hidden: false, conflicts: [] })
      return
    }
    const isLtp = p.title === LEARN_TO_PLAY
    if (!isLtp && coveredByRinkEvent(pi, dateKey, tournaments, onIce)) {
      info.set(p.id, { hidden: true, conflicts: [] })
      return
    }
    const teams = practiceTeams(p)
    const conflicts = games.filter((g) => {
      const gi = gameInterval(g)
      if (!gi || !intervalsOverlap(pi, gi)) return false
      return g.location !== 'away' || teams.includes(g.team)
    })
    const hiddenByGame = !isLtp && conflicts.some((g) => g.location !== 'away')
    info.set(p.id, { hidden: hiddenByGame, conflicts })
  })
  return info
}
