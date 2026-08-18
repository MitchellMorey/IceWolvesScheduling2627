export const REAL_TEAMS = ['Bantam', 'Peewee', 'Squirt', 'She Wolves']

// "Open" is not a real team - it marks ice time that's held/blocked off but
// not yet claimed by a specific team. It shows up in the team select and
// team filters alongside the real teams so slots can be assigned to it or
// reassigned away from it.
export const OPEN_TEAM = 'Open'

export const TEAMS = [...REAL_TEAMS, OPEN_TEAM]

export const EVENT_TYPES = ['Game', 'Practice', 'Tournament', 'Open Skate', 'Other']

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
