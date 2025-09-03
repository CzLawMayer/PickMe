import React from "react"
import IconStat from "./IconStat"

type Props = {
  count?: number
  active?: boolean
  onToggle?: () => void
  className?: string
}
export default function LikeButton({ count, active, onToggle, className }: Props) {
  return (
    <IconStat
      icon="favorite"
      label="Like"
      count={count}
      active={active}
      onToggle={onToggle}
      className={`like-btn ${className ?? ""}`}
    />
  )
}
