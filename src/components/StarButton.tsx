import React from "react"
import IconStat from "./IconStat"

type Props = {
  ratingText?: string // e.g., "4.5/5"
  active?: boolean
  onToggle?: () => void
  className?: string
}
export default function StarButton({ ratingText, active, onToggle, className }: Props) {
  return (
    <IconStat
      icon="star"
      label="Rate"
      count={ratingText}
      active={active}
      onToggle={onToggle}
      className={`star-btn ${className ?? ""}`}
    />
  )
}
