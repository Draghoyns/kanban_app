import type { Tag } from '@/types'

interface Props {
  tag: Tag
  onRemove?: () => void
  small?: boolean
}

export default function TagBadge({ tag, onRemove, small }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
      style={{ backgroundColor: tag.color + '33', color: tag.color, border: `1px solid ${tag.color}55` }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
        >
          ×
        </button>
      )}
    </span>
  )
}
