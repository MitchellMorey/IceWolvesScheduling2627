export const REAL_TEAMS = ['Bantam', 'Peewee', 'Squirt', 'She Wolves']

// "Open" is not a real team - it marks ice time that's held/blocked off but
// not yet claimed by a specific team. It shows up in the team select and
// team filters alongside the real teams so slots can be assigned to it or
// reassigned away from it.
export const OPEN_TEAM = 'Open'

export const TEAMS = [...REAL_TEAMS, OPEN_TEAM]

// How long each team's ice time runs, in minutes - used to compute an
// end time for a slot from its start time + team, and to flag a new/
// reassigned slot that would run into a neighboring slot without at
// least MIN_GAP_MINUTES between them.
export const TEAM_DURATION_MINUTES = {
  Squirt: 60,
  'She Wolves': 60,
  Peewee: 75,
  Bantam: 90,
}

export const MIN_GAP_MINUTES = 15

// Status options for an opponent contact's "Scheduled" field.
export const SCHEDULED_OPTIONS = ['Yes', 'No', 'Contact Made']

export const EVENT_TYPES = ['Game', 'Practice', 'Tournament', 'Open Skate', 'Other']

// Every schedule entry is one of these kinds:
// - 'allocation': a standing marker for which team owns a recurring time
//   slot. It just holds team + date + time - no game details.
// - 'game': the actual game/practice/etc. filled in for a slot (opponent,
//   home/away, notes...). Games are separate rows from the allocation that
//   "owns" their slot, so filling in a game never overwrites the marker.
// - 'tournament': a team + date range (optionally all-day) rink event that
//   supersedes that team's individual ice-slot allocations for the dates
//   it covers.
// - 'on_ice_event': a rink-wide event on one date with a specific start/end
//   time, which supersedes any team's individual ice-slot allocations that
//   fall within that time range.
export const ENTRY_KIND = {
  ALLOCATION: 'allocation',
  GAME: 'game',
  TOURNAMENT: 'tournament',
  ON_ICE_EVENT: 'on_ice_event',
}

export const RINK_EVENT_KINDS = [ENTRY_KIND.TOURNAMENT, ENTRY_KIND.ON_ICE_EVENT]

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
