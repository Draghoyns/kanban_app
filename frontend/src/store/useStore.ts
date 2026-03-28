import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ticket, Memo, Tag, TicketCreate, TicketUpdate, TicketStatus, MemoCreate, MemoUpdate, TagCreate } from '@/types'

const genId = () => Date.now() + Math.floor(Math.random() * 1000)
const now   = () => new Date().toISOString()

// Returns true if a routine ticket template should spawn a new instance today
function isDue(t: Ticket, today: Date): boolean {
  if (!t.is_routine) return false

  // Don't generate before start_date
  if (t.start_date) {
    const start = new Date(t.start_date)
    start.setHours(0, 0, 0, 0)
    if (today < start) return false
  }

  if (!t.last_generated) return true

  const last = new Date(t.last_generated)
  last.setHours(0, 0, 0, 0)
  if (last >= today) return false // already generated today

  switch (t.frequency_type) {
    case 'daily': return true
    case 'weekdays': { const d = today.getDay(); return d >= 1 && d <= 5 }
    case 'weekly': {
      const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      return t.frequency_days?.includes(names[today.getDay()]) ?? false
    }
    case 'interval': {
      let ref = last
      if (t.start_date) {
        const start = new Date(t.start_date)
        start.setHours(0, 0, 0, 0)
        if (start > last) ref = start // start_date newer than last_generated → cycle was reset
      }
      const days = Math.floor((today.getTime() - ref.getTime()) / 86_400_000)
      return days >= (t.frequency_interval ?? 1)
    }
    default: return false
  }
}

interface AppStore {
  tickets:     Ticket[]
  memos:       Memo[]
  tags:        Tag[]
  activeTab:        'kanban' | 'memo' | 'routine'
  hideDone:         boolean
  theme:            'dark' | 'light'
  accentColor:      string
  notificationHour:     number
  notificationMinute:   number
  notificationsEnabled: boolean
  sidebarOpen:          boolean
  backendUrl:           string
  newTicketTrigger:     number   // incremented to open new-ticket modal via shortcut
  newMemoTrigger:       number   // incremented to open new-memo modal via shortcut
  focusedColumn:        TicketStatus | null  // set by notification tap to scroll to column
  wipLimits:            Partial<Record<TicketStatus, number>>

  setActiveTab:           (tab: 'kanban' | 'memo' | 'routine') => void
  setHideDone:            (v: boolean) => void
  setTheme:               (theme: 'dark' | 'light') => void
  setAccentColor:         (color: string) => void
  setNotificationHour:    (hour: number) => void
  setNotificationMinute:  (minute: number) => void
  setNotificationsEnabled:(v: boolean) => void
  setSidebarOpen:         (v: boolean) => void
  setBackendUrl:          (url: string) => void
  setWipLimit:            (status: TicketStatus, limit: number | null) => void
  triggerNewTicket:       () => void
  triggerNewMemo:         () => void
  setFocusedColumn:       (col: TicketStatus | null) => void
  createTicket:           (data: TicketCreate) => Ticket
  updateTicket:           (id: number, data: TicketUpdate) => void
  updateTicketStatus:     (id: number, status: TicketStatus, position?: number) => void
  reorderColumn:          (orderedIds: number[]) => void
  deleteTicket:           (id: number) => void
  generateRoutineTickets: () => Ticket[]    // returns newly created instances

  createMemo:  (data: MemoCreate) => Memo
  updateMemo:  (id: number, data: MemoUpdate) => void
  deleteMemo:  (id: number) => void

  createTag: (data: TagCreate) => Tag
  deleteTag: (id: number) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tickets:     [],
      memos:       [],
      tags:        [],
      activeTab:        'kanban',
      hideDone:         false,
      theme:            'dark',
      accentColor:      '#ec4899',
      notificationHour:     9,
      notificationMinute:   0,
      notificationsEnabled: false,
      sidebarOpen:          false,
      backendUrl:           'http://192.168.1.4:8000',
      newTicketTrigger:     0,
      newMemoTrigger:       0,
      focusedColumn:        null,
      wipLimits:            {},

      setActiveTab:            (tab)   => set({ activeTab:            tab }),
      setHideDone:             (v)     => set({ hideDone:             v }),
      setTheme:                (theme) => set({ theme }),
      setAccentColor:          (c)     => set({ accentColor:          c }),
      setNotificationHour:     (h)     => set({ notificationHour:     h }),
      setNotificationMinute:   (m)     => set({ notificationMinute:   m }),
      setNotificationsEnabled: (v)     => set({ notificationsEnabled: v }),
      setSidebarOpen:          (v)     => set({ sidebarOpen:          v }),
      setBackendUrl:           (url)   => set({ backendUrl:           url }),
      setWipLimit:             (status, limit) => set(s => ({
        wipLimits: limit == null
          ? Object.fromEntries(Object.entries(s.wipLimits).filter(([k]) => k !== status))
          : { ...s.wipLimits, [status]: limit },
      })),
      triggerNewTicket:         ()      => set(s => ({ newTicketTrigger: s.newTicketTrigger + 1 })),
      triggerNewMemo:           ()      => set(s => ({ newMemoTrigger:   s.newMemoTrigger   + 1 })),
      setFocusedColumn:         (col)   => set({ focusedColumn: col }),
      // ── Tickets ──────────────────────────────────────────────────────────

      createTicket: (data) => {
        const tags = get().tags.filter(t => data.tag_ids?.includes(t.id) ?? false)
        const ticket: Ticket = {
          id:                 genId(),
          title:              data.title,
          description:        data.description        ?? null,
          status:             data.status             ?? 'backlog',
          priority:           data.priority           ?? null,
          estimation:         data.estimation         ?? null,
          due_date:           data.due_date           ?? null,
          position:           get().tickets.filter(t => t.status === (data.status ?? 'backlog')).length,
          is_routine:         data.is_routine         ?? false,
          frequency_type:     data.frequency_type     ?? null,
          frequency_days:     data.frequency_days     ?? null,
          frequency_interval: data.frequency_interval ?? null,
          start_date:         data.start_date         ?? null,
          last_generated:     null,
          parent_id:          null,
          created_at:         now(),
          updated_at:         now(),
          tags,
        }
        set(s => ({ tickets: [...s.tickets, ticket] }))
        return ticket
      },

      updateTicket: (id, data) => {
        set(s => ({
          tickets: s.tickets.map(t => {
            if (t.id !== id) return t
            const tags = data.tag_ids != null
              ? s.tags.filter(tag => data.tag_ids!.includes(tag.id))
              : t.tags
            return {
              ...t,
              ...(data.title              != null    ? { title: data.title }                           : {}),
              ...(data.description        != null    ? { description: data.description }               : {}),
              ...(data.status             != null    ? { status: data.status }                         : {}),
              ...(data.priority           !== undefined ? { priority: data.priority }                  : {}),
              ...(data.estimation         !== undefined ? { estimation: data.estimation }              : {}),
              ...(data.due_date           !== undefined ? { due_date: data.due_date }                  : {}),
              ...(data.start_date         !== undefined ? { start_date: data.start_date }              : {}),
              ...(data.position           != null    ? { position: data.position }                     : {}),
              ...(data.is_routine         != null    ? { is_routine: data.is_routine }                 : {}),
              ...(data.frequency_type     !== undefined ? { frequency_type: data.frequency_type }         : {}),
              ...(data.frequency_days     !== undefined ? { frequency_days: data.frequency_days }         : {}),
              ...(data.frequency_interval !== undefined ? { frequency_interval: data.frequency_interval } : {}),
              tags,
              updated_at: now(),
            }
          }),
        }))
      },

      updateTicketStatus: (id, status, position) => {
        set(s => ({
          tickets: s.tickets.map(t =>
            t.id === id
              ? { ...t, status, position: position ?? s.tickets.filter(x => x.status === status && x.id !== id).length, updated_at: now() }
              : t
          ),
        }))
      },

      deleteTicket: (id) => {
        set(s => ({ tickets: s.tickets.filter(t => t.id !== id) }))
      },

      reorderColumn: (orderedIds) => {
        set(s => ({
          tickets: s.tickets.map(t => {
            const idx = orderedIds.indexOf(t.id)
            return idx !== -1 ? { ...t, position: idx, updated_at: now() } : t
          }),
        }))
      },

      // Spawns a backlog instance for every overdue routine template.
      // Safe to call every app launch — idempotent within a single calendar day.
      generateRoutineTickets: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString()

        const { tickets } = get()
        const dueTo        = tickets.filter(t => isDue(t, today))
        if (dueTo.length === 0) return []

        const instances: Ticket[] = dueTo.map((t, i) => ({
          id:                 genId() + i,
          title:              t.title,
          description:        t.description,
          status:             'today',
          priority:           t.priority ?? null,
          estimation:         t.estimation ?? null,
          due_date:           null,
          position:           tickets.filter(x => x.status === 'today').length + i,
          is_routine:         false,
          frequency_type:     null,
          frequency_days:     null,
          frequency_interval: null,
          start_date:         null,
          last_generated:     null,
          parent_id:          t.id,
          created_at:         now(),
          updated_at:         now(),
          tags:               t.tags,
        }))

        set(s => ({
          tickets: [
            // Stamp last_generated on each template
            ...s.tickets.map(t => dueTo.find(d => d.id === t.id) ? { ...t, last_generated: todayStr } : t),
            ...instances,
          ],
        }))

        return instances
      },

      // ── Memos ─────────────────────────────────────────────────────────────

      createMemo: (data) => {
        const tags = get().tags.filter(t => data.tag_ids?.includes(t.id) ?? false)
        const memo: Memo = {
          id:         genId(),
          title:      data.title,
          content:    data.content ?? null,
          color:      data.color   ?? '#1e293b',
          pinned:     data.pinned  ?? false,
          created_at: now(),
          updated_at: now(),
          tags,
        }
        set(s => ({ memos: [memo, ...s.memos] }))
        return memo
      },

      updateMemo: (id, data) => {
        set(s => ({
          memos: s.memos.map(m => {
            if (m.id !== id) return m
            const tags = data.tag_ids != null
              ? s.tags.filter(t => data.tag_ids!.includes(t.id))
              : m.tags
            return {
              ...m,
              ...(data.title   != null ? { title: data.title }     : {}),
              ...(data.content != null ? { content: data.content } : {}),
              ...(data.color   != null ? { color: data.color }     : {}),
              ...(data.pinned  != null ? { pinned: data.pinned }   : {}),
              tags,
              updated_at: now(),
            }
          }),
        }))
      },

      deleteMemo: (id) => {
        set(s => ({ memos: s.memos.filter(m => m.id !== id) }))
      },

      // ── Tags ──────────────────────────────────────────────────────────────

      createTag: (data) => {
        const tag: Tag = { id: genId(), ...data }
        set(s => ({ tags: [...s.tags, tag] }))
        return tag
      },

      deleteTag: (id) => {
        set(s => ({
          tags:    s.tags.filter(t => t.id !== id),
          tickets: s.tickets.map(t => ({ ...t, tags: t.tags.filter(tag => tag.id !== id) })),
          memos:   s.memos.map(m => ({ ...m, tags: m.tags.filter(tag => tag.id !== id) })),
        }))
      },
    }),
    {
      name: 'kanban-store',
      partialize: (s) => ({
        tickets:              s.tickets,
        memos:                s.memos,
        tags:                 s.tags,
        activeTab:            s.activeTab,
        hideDone:             s.hideDone,
        theme:                s.theme,
        accentColor:          s.accentColor,
        notificationHour:     s.notificationHour,
        notificationMinute:   s.notificationMinute,
        notificationsEnabled: s.notificationsEnabled,
        backendUrl:           s.backendUrl,
        wipLimits:            s.wipLimits,
        // sidebarOpen, newTicketTrigger, newMemoTrigger intentionally excluded
      }),
    }
  )
)

