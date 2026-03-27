export type TicketStatus   = 'backlog' | 'in_progress' | 'blocked' | 'today' | 'done'
export type FrequencyType  = 'daily' | 'weekly' | 'interval' | 'weekdays'
export type PriorityLevel  = 'P1' | 'P2' | 'P3' | 'P4'
export type EstimationSize = '1' | '2' | '3' | '5' | '8'

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
  priority:           PriorityLevel | null
  estimation:         EstimationSize | null
  due_date:           string | null  // YYYY-MM-DD
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
  priority?:           PriorityLevel | null
  estimation?:         EstimationSize | null
  due_date?:           string | null
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
  priority?:           PriorityLevel | null
  estimation?:         EstimationSize | null
  due_date?:           string | null
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


export const PRIORITY_LEVELS: {
  id:     PriorityLevel
  label:  string
  color:  string
  border: string
  badge:  string
}[] = [
  { id: 'P1', label: 'P1', color: 'text-rose-400',   border: 'border-rose-600',   badge: 'bg-rose-500/15 text-rose-500 border border-rose-500/40'       },
  { id: 'P2', label: 'P2', color: 'text-orange-400', border: 'border-orange-500', badge: 'bg-orange-500/15 text-orange-500 border border-orange-500/40'   },
  { id: 'P3', label: 'P3', color: 'text-yellow-400', border: 'border-yellow-500', badge: 'bg-yellow-500/15 text-yellow-600 border border-yellow-500/40'   },
  { id: 'P4', label: 'P4', color: 'text-slate-400',  border: 'border-slate-600',  badge: 'bg-slate-500/15 text-slate-500 border border-slate-500/40'     },
]

export const ESTIMATION_SIZES: {
  id:    EstimationSize
  label: string
  badge: string
}[] = [
  { id: '1', label: '1', badge: 'bg-slate-500/15 text-slate-500 border border-slate-500/40'   },
  { id: '2', label: '2', badge: 'bg-blue-500/15 text-blue-500 border border-blue-500/40'     },
  { id: '3', label: '3', badge: 'bg-violet-500/15 text-violet-500 border border-violet-500/40' },
  { id: '5', label: '5', badge: 'bg-orange-500/15 text-orange-500 border border-orange-500/40' },
  { id: '8', label: '8', badge: 'bg-rose-500/15 text-rose-500 border border-rose-500/40'       },
]

export const MEMO_COLORS = [
  '#fde68a', '#fed7aa', '#fca5a5', '#f9a8d4', '#d8b4fe', '#a5b4fc', '#6ee7b7',
]


