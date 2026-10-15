import { ENTRY_KIND, OPEN_TEAM } from './constants'
import { timeToMinutes } from './dateUtils'

// One worksheet per team, in this order, named like the league's own
// "Home Game Schedule" workbook.
const SHEETS = [
  { team: '6U', name: '6U' },
  { team: '8U', name: '8U' },
  { team: 'She Wolves', name: 'She Wolves 10U' },
  { team: 'Squirt', name: 'Squirt 10U' },
  { team: 'Peewee', name: 'Peewee 12U' },
  { team: 'Bantam', name: 'Bantam 14U' },
]

const HEADER_BLUE = 'FF0B5394'
const TIME_FORMAT = 'h:mm am/pm'
const DATE_FORMAT = 'm/d/yyyy'

// Entries of kind 'game' that aren't actually games for a team's season.
const NON_GAME_TYPES = new Set(['Practice', 'Open Skate'])

export function gamesForTeam(events, team) {
  return events
    .filter(
      (ev) =>
        ev.kind === ENTRY_KIND.GAME &&
        ev.team === team &&
        ev.team !== OPEN_TEAM &&
        !NON_GAME_TYPES.has(ev.event_type)
    )
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
}

// Builds a workbook laid out like the league's Home_Game_Schedule file:
// Location | Opponent | Date (mm/dd/yyyy) | Start Time, blue header row,
// frozen header, Home/Away + start-time drop-downs, helper lists hidden.
export function buildScheduleWorkbook(ExcelJS, events) {
  const wb = new ExcelJS.Workbook()

  SHEETS.forEach(({ team, name }) => {
    const ws = wb.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    const games = gamesForTeam(events, team)
    const longestOpponent = games.reduce((n, g) => Math.max(n, (g.opponent || 'TBD').length), 0)

    ws.columns = [
      { width: 10.88 },
      { width: Math.max(18.88, longestOpponent + 3) },
      { width: 15.88 },
      { width: 16.63 },
    ]

    // Helper lists the drop-downs read from (columns F and G), hidden along
    // with E - same as the league's workbook.
    ws.getCell('G2').value = 'Home'
    ws.getCell('G3').value = 'Away'
    for (let i = 0; i < 51; i++) {
      ws.getCell(`F${i + 2}`).value = (8 * 60 + i * 15) / 1440
      ws.getCell(`F${i + 2}`).numFmt = TIME_FORMAT
    }
    for (let c = 5; c <= 27; c++) ws.getColumn(c).hidden = true

    const header = ws.getRow(1)
    ;['Location', 'Opponent', 'Date (mm/dd/yyyy)', 'Start Time'].forEach((label, i) => {
      const cell = header.getCell(i + 1)
      cell.value = label
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BLUE } }
      if (i === 2) cell.alignment = { horizontal: 'center' }
    })

    games.forEach((g, i) => {
      const row = ws.getRow(i + 2)
      const [y, m, d] = g.date.split('-').map(Number)
      const mins = g.time ? timeToMinutes(g.time) : null

      row.getCell(1).value = g.location === 'away' ? 'Away' : 'Home'
      row.getCell(2).value = g.opponent || 'TBD'
      const dateCell = row.getCell(3)
      dateCell.value = new Date(Date.UTC(y, m - 1, d))
      dateCell.numFmt = DATE_FORMAT
      dateCell.alignment = { horizontal: 'center' }
      if (mins != null) {
        const timeCell = row.getCell(4)
        timeCell.value = mins / 1440
        timeCell.numFmt = TIME_FORMAT
        timeCell.alignment = { horizontal: 'left' }
      }
      for (let c = 1; c <= 4; c++) row.getCell(c).font = { name: 'Arial' }
    })

    const lastRow = Math.max(100, games.length + 50)
    const quoted = `'${name}'`
    for (let r = 2; r <= lastRow; r++) {
      ws.getCell(`A${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        formulae: [`${quoted}!$G$2:$G$3`],
      }
      ws.getCell(`D${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        formulae: [`${quoted}!$F$2:$F$52`],
      }
    }
  })

  return wb
}

export async function exportGameSchedule(events) {
  // Loaded on demand so the Excel library isn't part of the normal page load.
  const ExcelJS = (await import('exceljs')).default
  const wb = buildScheduleWorkbook(ExcelJS, events)
  const buffer = await wb.xlsx.writeBuffer()

  const now = new Date()
  const stamp = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Home_Game_Schedule_${stamp}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
