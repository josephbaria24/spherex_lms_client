"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_OTHER,
} from "@/lib/course-categories"

type CourseCategoryFieldsProps = {
  idPrefix: string
  value: string
  onChange: (category: string) => void
}

function isPresetCategory(category: string) {
  return (COURSE_CATEGORIES as readonly string[]).includes(category)
}

export function CourseCategoryFields({ idPrefix, value, onChange }: CourseCategoryFieldsProps) {
  const [otherSelected, setOtherSelected] = useState(
    () => Boolean(value) && !isPresetCategory(value),
  )

  useEffect(() => {
    if (isPresetCategory(value)) {
      setOtherSelected(false)
      return
    }
    if (value) setOtherSelected(true)
  }, [value])

  const isOther = otherSelected || (Boolean(value) && !isPresetCategory(value))
  const selectValue = isOther ? COURSE_CATEGORY_OTHER : value || undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-category`}>Category</Label>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === COURSE_CATEGORY_OTHER) {
            setOtherSelected(true)
            onChange(isPresetCategory(value) ? "" : value)
            return
          }
          setOtherSelected(false)
          onChange(next)
        }}
      >
        <SelectTrigger id={`${idPrefix}-category`} className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {COURSE_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
          <SelectItem value={COURSE_CATEGORY_OTHER}>Other</SelectItem>
        </SelectContent>
      </Select>
      {isOther ? (
        <Input
          id={`${idPrefix}-category-other`}
          name="category"
          placeholder="Enter custom category"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </div>
  )
}
