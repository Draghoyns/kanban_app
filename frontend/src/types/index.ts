export type TicketStatus = 'backlog' | 'in_progress' | 'blocked' | 'today' | 'done'
export type FrequencyType = 'daily' | 'weekly' | 'interval' | 'weekdays'

export interface Tag {
  id:    number
  name:  string
  color: string
}

export interface Ticket {
  id:                 number
  title:              string
  description:        string | null
  status:             TicketStatus
  position:           number
  is_routine:         boolean
  frequency_type:     FrequencyType | null
  frequency_days:     string[] | null
  frequency_interval: number | null
  last_generated:     string | null
  parent_id:          number | null
  created_at:         string
  updated_at:         string
  tags:               Tag[]
}

export interface Memo {
  id:         number
  title:      string
  content:    string | null
  color:      string
  pinned:     boolean
  created_at: string
  updated_at: string
  tags:       Tag[]
}

export interface TicketCreate {
  title:               string
  description?:        string
  status:              TicketStatus
  is_routine?:         boolean
  frequency_type?:     FrequencyType | null
  frequency_days?:     string[] | null
  frequency_interval?: number | null
  tag_ids?:            number[]
}

export interface TicketUpdate {
  title?:              string
  description?:        string
  status?:             TicketStatus
  position?:           number
  is_routine?:         boolean
  frequency_type?:     FrequencyType | null
  frequency_days?:     string[] | null
  frequency_interval?: number | null
  tag_ids?:            number[]
}

export interface MemoCreate {
  title:    string
  content?: string
  color?:   string
  pinned?:  boolean
  tag_ids?: number[]
}

export interface MemoUpdate {
  title?:   string
  content?: string
  color?:   string
  pinned?:  boolean
  tag_ids?: number[]
}

export interface TagCreate {
  name:  string
  color: string
}

export const WEEKDAYS = [
  { id: 'monday',    label: 'Mon' },
  { id: 'tuesday',   label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday',  label: 'Thu' },
  { id: 'friday',    label: 'Fri' },
  { id: 'saturday',  label: 'Sat' },
  { id: 'sunday',    label: 'Sun' },
] as const

export const STATUSES: { id: TicketStatus; label: string; color: string; border: string }[] = [
  { id: 'backlog',     label: 'Backlog',     color: 'text-slate-400',   border: 'border-slate-500'   },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-400',    border: 'border-blue-500'    },
  { id: 'blocked',     label: 'Blocked',     color: 'text-rose-400',    border: 'border-rose-500'    },
  { id: 'today',       label: 'Today',       color: 'text-amber-400',   border: 'border-amber-500'   },
  { id: 'done',        label: 'Done',        color: 'text-emerald-400', border: 'border-emerald-500' },
]


export const MEMO_COLORS = [
  '#1e293b', '#1e3a5f', '#1a3a2a', '#3b1e2a', '#2d1e3b', '#3b2a1e', '#1e2d3b',
]


