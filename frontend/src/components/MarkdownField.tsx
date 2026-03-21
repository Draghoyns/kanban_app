import { useState } from 'react'
import { Eye, Edit2 } from 'lucide-react'

interface Props {
  label?:      string
  value:       string
  onChange:    (v: string) => void
  rows?:       number
  placeholder?: string
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const lines = text.split('\n')

  lines.forEach((line, i) => {
    if (line.startsWith('### '))
      nodes.push(<h3 key={i} className="text-xs font-semibold text-slate-300 mt-2 mb-0.5">{inline(line.slice(4))}</h3>)
    else if (line.startsWith('## '))
      nodes.push(<h2 key={i} className="text-sm font-semibold mt-3 mb-0.5" style={{ color: 'var(--accent)' }}>{inline(line.slice(3))}</h2>)
    else if (line.startsWith('# '))
      nodes.push(<h1 key={i} className="text-base font-bold text-slate-100 mt-3 mb-1">{inline(line.slice(2))}</h1>)
    else if (line.startsWith('> '))
      nodes.push(<blockquote key={i} className="border-l-2 border-slate-600 pl-3 text-slate-400 text-sm italic my-0.5">{inline(line.slice(2))}</blockquote>)
    else if (/^[-*+] /.test(line))
      nodes.push(<li key={i} className="text-sm text-slate-300 leading-relaxed ml-3 list-disc">{inline(line.slice(2))}</li>)
    else if (/^\d+\. /.test(line))
      nodes.push(<li key={i} className="text-sm text-slate-300 leading-relaxed ml-3 list-decimal">{inline(line.replace(/^\d+\. /, ''))}</li>)
    else if (line.trim() === '')
      nodes.push(<div key={i} className="h-1.5" />)
    else
      nodes.push(<p key={i} className="text-sm text-slate-300 leading-relaxed">{inline(line)}</p>)
  })

  return nodes
}

function inline(text: string): React.ReactNode {
  // Split on bold, italic, code markers
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="font-mono text-xs bg-slate-700 text-amber-300 px-1 py-0.5 rounded">{part.slice(1, -1)}</code>
    return part
  })
}

export default function MarkdownField({ label, value, onChange, rows = 4, placeholder }: Props) {
  const [preview, setPreview] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
        <button
          type="button"
          onClick={() => setPreview(v => !v)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors ml-auto"
        >
          {preview ? <Edit2 size={11} /> : <Eye size={11} />}
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 min-h-[60px]">
          {value.trim() ? renderMarkdown(value) : <p className="text-sm text-slate-600 italic">Nothing to preview.</p>}
        </div>
      ) : (
        <textarea
          className="textarea"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
