import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type PickerMode = 'datetime'
type Meridiem = 'AM' | 'PM'

type MobileDateTimePickerProps = {
  isOpen: boolean
  value: Date | null
  onClose: () => void
  onChange: (date: Date | null) => void
  mode?: PickerMode
  minDate?: Date
  maxDate?: Date
  disablePast?: boolean
  minuteStep?: number
  title?: string
}

type MobileDateTimePickerSheetProps = {
  value: Date | null
  onClose: () => void
  onChange: (date: Date | null) => void
  minDate: Date | null
  maxDate: Date | null
  minuteOptions: number[]
  title: string
}

type PickerDraftState = {
  displayMonth: Date
  selectedDay: Date | null
  selectedHour: number
  selectedMinute: number
  selectedMeridiem: Meridiem
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS_12 = Array.from({ length: 12 }, (_, index) => index + 1)
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function compareMonths(left: Date, right: Date) {
  return left.getFullYear() * 12 + left.getMonth() - (right.getFullYear() * 12 + right.getMonth())
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isBeforeDay(left: Date, right: Date) {
  return startOfDay(left).getTime() < startOfDay(right).getTime()
}

function isAfterDay(left: Date, right: Date) {
  return startOfDay(left).getTime() > startOfDay(right).getTime()
}

function to12HourParts(date: Date): {
  hour: number
  minute: number
  meridiem: Meridiem
} {
  const hour24 = date.getHours()

  return {
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute: date.getMinutes(),
    meridiem: hour24 >= 12 ? 'PM' : 'AM',
  }
}

function to24Hour(hour12: number, meridiem: Meridiem) {
  if (meridiem === 'AM') {
    return hour12 === 12 ? 0 : hour12
  }

  return hour12 === 12 ? 12 : hour12 + 12
}

function resolveMinuteStep(value: number | undefined) {
  if (!value || Number.isNaN(value)) {
    return 5
  }

  return Math.min(30, Math.max(1, Math.floor(value)))
}

function getMinuteOptions(step: number) {
  const options: number[] = []

  for (let minute = 0; minute < 60; minute += step) {
    options.push(minute)
  }

  return options
}

function snapMinuteToStep(minute: number, minuteOptions: number[]) {
  return minuteOptions.reduce((closest, candidate) => {
    if (Math.abs(candidate - minute) < Math.abs(closest - minute)) {
      return candidate
    }

    return closest
  }, minuteOptions[0] ?? 0)
}

function clampDateTime(date: Date, minDate?: Date | null, maxDate?: Date | null) {
  if (minDate && maxDate && minDate.getTime() > maxDate.getTime()) {
    return null
  }

  const next = new Date(date)

  if (minDate && next.getTime() < minDate.getTime()) {
    return new Date(minDate)
  }

  if (maxDate && next.getTime() > maxDate.getTime()) {
    return new Date(maxDate)
  }

  return next
}

function isDateTimeInRange(date: Date, minDate?: Date | null, maxDate?: Date | null) {
  if (minDate && date.getTime() < minDate.getTime()) {
    return false
  }

  if (maxDate && date.getTime() > maxDate.getTime()) {
    return false
  }

  return true
}

function buildCalendarCells(monthStart: Date) {
  const firstWeekday = monthStart.getDay()
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function createInitialDraftState(
  value: Date | null,
  minDate: Date | null,
  maxDate: Date | null,
  minuteOptions: number[],
): PickerDraftState {
  const baseline = value ? new Date(value) : new Date()
  const clamped = clampDateTime(baseline, minDate, maxDate) ?? baseline
  const timeParts = to12HourParts(clamped)

  return {
    displayMonth: getMonthStart(clamped),
    selectedDay: startOfDay(clamped),
    selectedHour: timeParts.hour,
    selectedMinute: snapMinuteToStep(timeParts.minute, minuteOptions),
    selectedMeridiem: timeParts.meridiem,
  }
}

function MobileDateTimePickerSheet({
  value,
  onClose,
  onChange,
  minDate,
  maxDate,
  minuteOptions,
  title,
}: MobileDateTimePickerSheetProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const initialState = useMemo(
    () => createInitialDraftState(value, minDate, maxDate, minuteOptions),
    [value, minDate, maxDate, minuteOptions],
  )

  const [displayMonth, setDisplayMonth] = useState(initialState.displayMonth)
  const [selectedDay, setSelectedDay] = useState<Date | null>(initialState.selectedDay)
  const [selectedHour, setSelectedHour] = useState(initialState.selectedHour)
  const [selectedMinute, setSelectedMinute] = useState(initialState.selectedMinute)
  const [selectedMeridiem, setSelectedMeridiem] = useState<Meridiem>(initialState.selectedMeridiem)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      modalRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const monthStart = getMonthStart(displayMonth)
  const monthLabel = MONTH_LABEL_FORMATTER.format(monthStart)
  const calendarCells = useMemo(() => buildCalendarCells(monthStart), [monthStart])

  const minDayBoundary = useMemo(() => (minDate ? startOfDay(minDate) : null), [minDate])
  const maxDayBoundary = useMemo(() => (maxDate ? startOfDay(maxDate) : null), [maxDate])
  const minMonthStart = minDayBoundary ? getMonthStart(minDayBoundary) : null
  const maxMonthStart = maxDayBoundary ? getMonthStart(maxDayBoundary) : null

  const canGoPreviousMonth = !minMonthStart || compareMonths(monthStart, minMonthStart) > 0
  const canGoNextMonth = !maxMonthStart || compareMonths(monthStart, maxMonthStart) < 0

  const selectedDateTime = useMemo(() => {
    if (!selectedDay) {
      return null
    }

    return new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      to24Hour(selectedHour, selectedMeridiem),
      selectedMinute,
      0,
      0,
    )
  }, [selectedDay, selectedHour, selectedMinute, selectedMeridiem])

  const isSelectionValid = useMemo(() => {
    if (!selectedDateTime) {
      return true
    }

    return isDateTimeInRange(selectedDateTime, minDate, maxDate)
  }, [selectedDateTime, minDate, maxDate])

  const today = startOfDay(new Date())

  const isPastDay = (day: Date) => isBeforeDay(day, today)
  const isBeforeMinDay = (day: Date) =>
    minDayBoundary ? isBeforeDay(day, minDayBoundary) : false
  const isAfterMaxDay = (day: Date) =>
    maxDayBoundary ? isAfterDay(day, maxDayBoundary) : false
  const isDayDisabled = (day: Date) => {
    const isPast = isPastDay(day)
    const isBeforeMin = isBeforeMinDay(day)
    const isAfterMax = isAfterMaxDay(day)

    return isPast || isBeforeMin || isAfterMax
  }

  const canUseTime = (hour: number, minute: number, meridiem: Meridiem) => {
    if (!selectedDay) {
      return true
    }

    const candidate = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      to24Hour(hour, meridiem),
      minute,
      0,
      0,
    )

    return isDateTimeInRange(candidate, minDate, maxDate)
  }

  const findFirstValidMinute = (hour: number, meridiem: Meridiem) => {
    const candidate = minuteOptions.find((minute) => canUseTime(hour, minute, meridiem))
    return typeof candidate === 'number' ? candidate : null
  }

  const findFirstValidHourMinute = (meridiem: Meridiem) => {
    for (const hour of HOURS_12) {
      const minute = findFirstValidMinute(hour, meridiem)
      if (minute !== null) {
        return { hour, minute }
      }
    }

    return null
  }

  const isHourDisabled = (hour: number) =>
    selectedDay
      ? !minuteOptions.some((minute) => canUseTime(hour, minute, selectedMeridiem))
      : false

  const isMinuteDisabled = (minute: number) =>
    selectedDay ? !canUseTime(selectedHour, minute, selectedMeridiem) : false

  const isMeridiemDisabled = (meridiem: Meridiem) =>
    selectedDay
      ? !HOURS_12.some((hour) => minuteOptions.some((minute) => canUseTime(hour, minute, meridiem)))
      : false

  const handleSelectDay = (day: Date) => {
    if (isDayDisabled(day)) {
      return
    }

    const normalizedDay = startOfDay(day)
    setSelectedDay(normalizedDay)

    const candidate = new Date(
      normalizedDay.getFullYear(),
      normalizedDay.getMonth(),
      normalizedDay.getDate(),
      to24Hour(selectedHour, selectedMeridiem),
      selectedMinute,
      0,
      0,
    )
    const clamped = clampDateTime(candidate, minDate, maxDate)

    if (clamped && isSameDay(clamped, normalizedDay)) {
      const parts = to12HourParts(clamped)
      setSelectedHour(parts.hour)
      setSelectedMinute(snapMinuteToStep(parts.minute, minuteOptions))
      setSelectedMeridiem(parts.meridiem)
    }
  }

  const handleSelectHour = (hour: number) => {
    const isDisabled = isHourDisabled(hour)
    if (isDisabled) {
      return
    }

    let nextMinute = selectedMinute
    if (!canUseTime(hour, nextMinute, selectedMeridiem)) {
      const fallbackMinute = findFirstValidMinute(hour, selectedMeridiem)
      if (fallbackMinute === null) {
        return
      }
      nextMinute = fallbackMinute
    }

    setSelectedHour(hour)
    setSelectedMinute(nextMinute)
  }

  const handleSelectMinute = (minute: number) => {
    const isDisabled = isMinuteDisabled(minute)
    if (isDisabled) {
      return
    }

    setSelectedMinute(minute)
  }

  const handleSelectMeridiem = (meridiem: Meridiem) => {
    const isDisabled = isMeridiemDisabled(meridiem)
    if (isDisabled) {
      return
    }

    let nextHour = selectedHour
    let nextMinute = selectedMinute

    if (!canUseTime(nextHour, nextMinute, meridiem)) {
      const minuteForCurrentHour = findFirstValidMinute(nextHour, meridiem)
      if (minuteForCurrentHour !== null) {
        nextMinute = minuteForCurrentHour
      } else {
        const fallback = findFirstValidHourMinute(meridiem)
        if (!fallback) {
          return
        }
        nextHour = fallback.hour
        nextMinute = fallback.minute
      }
    }

    setSelectedMeridiem(meridiem)
    setSelectedHour(nextHour)
    setSelectedMinute(nextMinute)
  }

  const handleConfirm = () => {
    if (selectedDateTime && !isSelectionValid) {
      return
    }

    onChange(selectedDateTime)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close date time picker"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-6">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className="relative z-10 flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-[#dbeafe] bg-white shadow-[0_26px_58px_-30px_rgba(15,23,42,0.65)] animate-[rise-in_220ms_cubic-bezier(0.22,1,0.36,1)_both] sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl"
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

          <header className="sticky top-0 z-10 border-b border-[#dbeafe] bg-white px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:rounded-t-2xl sm:px-5 sm:pt-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Back"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eff6ff] text-base font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
              >
                &larr;
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-[#1E40AF] sm:text-lg">
                  {title}
                </h2>
                <p className="text-xs text-slate-500">Choose when this promo starts or ends.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold text-slate-500 transition hover:bg-slate-100"
                aria-label="Close"
              >
                x
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
            <section className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => canGoPreviousMonth && setDisplayMonth(addMonths(monthStart, -1))}
                  disabled={!canGoPreviousMonth}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cbd5e1] bg-white text-lg text-[#1d4ed8] transition hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous month"
                >
                  &larr;
                </button>
                <p className="text-sm font-semibold text-slate-800">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => canGoNextMonth && setDisplayMonth(addMonths(monthStart, 1))}
                  disabled={!canGoNextMonth}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cbd5e1] bg-white text-lg text-[#1d4ed8] transition hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next month"
                >
                  &rarr;
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {WEEKDAY_LABELS.map((weekday) => (
                  <span key={weekday} className="py-1">
                    {weekday}
                  </span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarCells.map((day, index) => {
                  if (!day) {
                    return <span key={`empty-${index}`} className="h-9" aria-hidden="true" />
                  }

                  const isPast = isPastDay(day)
                  const isBeforeMin = isBeforeMinDay(day)
                  const isAfterMax = isAfterMaxDay(day)
                  const isDisabled = isPast || isBeforeMin || isAfterMax
                  const isToday = isSameDay(day, today)
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                  let dayClassName = 'text-slate-700 hover:bg-[#eff6ff] active:bg-[#dbeafe]'

                  if (isDisabled) {
                    dayClassName = 'cursor-not-allowed bg-slate-100 text-slate-300'
                  } else if (isSelected) {
                    dayClassName =
                      'bg-[#2563EB] text-white ring-2 ring-[#2563EB] shadow-[0_8px_16px_-12px_rgba(37,99,235,0.85)]'
                  } else if (isToday) {
                    dayClassName = 'border border-[#93c5fd] text-[#1d4ed8] hover:bg-[#eff6ff]'
                  }

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) {
                          return
                        }

                        handleSelectDay(day)
                      }}
                      className={`h-9 rounded-md text-sm font-medium transition ${dayClassName}`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="mt-3 rounded-xl border border-[#dbeafe] bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
                Time
              </h3>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-1.5">
                  <p className="px-1 text-[11px] font-semibold text-slate-500">Hour</p>
                  <div className="mt-1 max-h-32 snap-y snap-mandatory overflow-y-auto pr-0.5">
                    {HOURS_12.map((hour) => {
                      const isDisabled = isHourDisabled(hour)
                      const isSelected = selectedHour === hour
                      let optionClassName = 'bg-white text-slate-700 hover:bg-[#eff6ff] active:bg-[#dbeafe]'

                      if (isDisabled) {
                        optionClassName =
                          'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-300'
                      } else if (isSelected) {
                        optionClassName = 'bg-[#2563EB] text-white ring-2 ring-[#2563EB]'
                      }

                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) {
                              return
                            }

                            handleSelectHour(hour)
                          }}
                          className={`mt-1 h-9 w-full snap-center rounded-md text-sm font-semibold transition ${optionClassName}`}
                        >
                          {hour}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-1.5">
                  <p className="px-1 text-[11px] font-semibold text-slate-500">Minute</p>
                  <div className="mt-1 max-h-32 snap-y snap-mandatory overflow-y-auto pr-0.5">
                    {minuteOptions.map((minute) => {
                      const isDisabled = isMinuteDisabled(minute)
                      const isSelected = selectedMinute === minute
                      let optionClassName = 'bg-white text-slate-700 hover:bg-[#eff6ff] active:bg-[#dbeafe]'

                      if (isDisabled) {
                        optionClassName =
                          'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-300'
                      } else if (isSelected) {
                        optionClassName = 'bg-[#2563EB] text-white ring-2 ring-[#2563EB]'
                      }

                      return (
                        <button
                          key={minute}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) {
                              return
                            }

                            handleSelectMinute(minute)
                          }}
                          className={`mt-1 h-9 w-full snap-center rounded-md text-sm font-semibold transition ${optionClassName}`}
                        >
                          {`${minute}`.padStart(2, '0')}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-1.5">
                  <p className="px-1 text-[11px] font-semibold text-slate-500">AM/PM</p>
                  <div className="mt-1 max-h-32 snap-y snap-mandatory overflow-y-auto pr-0.5">
                    {(['AM', 'PM'] as const).map((meridiem) => {
                      const isDisabled = isMeridiemDisabled(meridiem)
                      const isSelected = selectedMeridiem === meridiem
                      let optionClassName = 'bg-white text-slate-700 hover:bg-[#eff6ff] active:bg-[#dbeafe]'

                      if (isDisabled) {
                        optionClassName =
                          'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-300'
                      } else if (isSelected) {
                        optionClassName = 'bg-[#2563EB] text-white ring-2 ring-[#2563EB]'
                      }

                      return (
                        <button
                          key={meridiem}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) {
                              return
                            }

                            handleSelectMeridiem(meridiem)
                          }}
                          className={`mt-1 h-9 w-full snap-center rounded-md text-sm font-semibold transition ${optionClassName}`}
                        >
                          {meridiem}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="sticky bottom-0 z-10 border-t border-[#dbeafe] bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-4">
            {!isSelectionValid ? (
              <p className="mb-2 text-xs font-medium text-rose-600">
                Selected date and time is outside the allowed range.
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isSelectionValid}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

function MobileDateTimePicker({
  isOpen,
  value,
  onClose,
  onChange,
  mode = 'datetime',
  minDate,
  maxDate,
  disablePast = false,
  minuteStep = 5,
  title = 'Select date & time',
}: MobileDateTimePickerProps) {
  const normalizedMinuteStep = useMemo(() => resolveMinuteStep(minuteStep), [minuteStep])
  const minuteOptions = useMemo(
    () => getMinuteOptions(normalizedMinuteStep),
    [normalizedMinuteStep],
  )

  const effectiveMinDate = useMemo(() => {
    const now = new Date()

    if (disablePast && minDate) {
      return minDate.getTime() > now.getTime() ? new Date(minDate) : now
    }

    if (disablePast) {
      return now
    }

    return minDate ? new Date(minDate) : null
  }, [disablePast, minDate])

  const effectiveMaxDate = useMemo(() => (maxDate ? new Date(maxDate) : null), [maxDate])

  if (!isOpen || typeof document === 'undefined' || mode !== 'datetime') {
    return null
  }

  return createPortal(
    <MobileDateTimePickerSheet
      value={value}
      onClose={onClose}
      onChange={onChange}
      minDate={effectiveMinDate}
      maxDate={effectiveMaxDate}
      minuteOptions={minuteOptions}
      title={title}
    />,
    document.body,
  )
}

export default MobileDateTimePicker
