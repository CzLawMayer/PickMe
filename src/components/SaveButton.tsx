import React from "react"
import IconStat from "./IconStat"

type Props = {
  count?: number
  active?: boolean
  onToggle?: () => void
  className?: string
}
export default function SaveButton({ count, active, onToggle, className }: Props) {
  return (
    <IconStat
      icon="bookmark"
      label="Save"
      count={count}
      active={active}
      onToggle={onToggle}
      className={`save-btn ${className ?? ""}`}
    />
  )
}
