'use client'

import { useState } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { WorkingHours } from '@/types'

interface WorkingHoursInputProps {
  value: WorkingHours
  onChange: (hours: WorkingHours) => void
}

const DAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' }
] as const

const TIME_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

// Helper type for object-based working hours
type WorkingHoursObject = Exclude<WorkingHours, '24/7'>

export default function WorkingHoursInput({ value, onChange }: WorkingHoursInputProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  // Convert value to object format for internal use
  const workingHoursObj: WorkingHoursObject = value === '24/7' 
    ? { mon: '24/7', tue: '24/7', wed: '24/7', thu: '24/7', fri: '24/7', sat: '24/7', sun: '24/7' }
    : value

  const handle24_7Toggle = (day: keyof WorkingHoursObject) => {
    let newHours: WorkingHours
    
    if (workingHoursObj[day] === '24/7') {
      // Switch to regular hours (default 08:00-17:00)
      const updated = { ...workingHoursObj }
      updated[day] = ["08:00", "17:00"]
      newHours = updated
    } else {
      // Switch to 24/7
      const updated = { ...workingHoursObj }
      updated[day] = '24/7'
      newHours = updated
    }
    
    onChange(newHours)
  }

  const addTimeSlot = (day: keyof WorkingHoursObject) => {
    const currentSlots = Array.isArray(workingHoursObj[day]) ? workingHoursObj[day] as string[] : []
    
    let updatedSlots: string[]
    
    // Add a new time slot (default: 08:00-17:00)
    if (currentSlots.length >= 2) {
      // If we already have slots, add another pair
      const lastEnd = currentSlots[currentSlots.length - 1]
      const newStart = incrementTime(lastEnd, 1) // Start 1 hour after last end
      const newEnd = incrementTime(newStart, 9) // 9-hour shift
      
      updatedSlots = [...currentSlots, newStart, newEnd]
    } else {
      // First time slot
      updatedSlots = ["08:00", "17:00"]
    }
    
    const newHours: WorkingHours = {
      ...workingHoursObj,
      [day]: updatedSlots
    }
    
    onChange(newHours)
  }

  const removeTimeSlot = (day: keyof WorkingHoursObject, slotIndex: number) => {
    const currentSlots = Array.isArray(workingHoursObj[day]) ? workingHoursObj[day] as string[] : []
    
    if (currentSlots.length <= 2) {
      // If removing the only slot, remove the day entirely
      const { [day]: removed, ...rest } = workingHoursObj
      onChange(rest)
    } else {
      // Remove the time slot pair
      const updatedSlots = [...currentSlots]
      updatedSlots.splice(slotIndex * 2, 2)
      
      const newHours: WorkingHours = {
        ...workingHoursObj,
        [day]: updatedSlots
      }
      
      onChange(newHours)
    }
  }

  const updateTimeSlot = (day: keyof WorkingHoursObject, slotIndex: number, timeIndex: number, newTime: string) => {
    const currentSlots = Array.isArray(workingHoursObj[day]) ? workingHoursObj[day] as string[] : []
    
    const updatedSlots = [...currentSlots]
    const actualIndex = slotIndex * 2 + timeIndex
    
    // Validate: start time should be before end time
    if (timeIndex === 0 && slotIndex * 2 + 1 < updatedSlots.length) {
      const endTime = updatedSlots[slotIndex * 2 + 1]
      if (newTime >= endTime) return // Invalid, don't update
    } else if (timeIndex === 1 && slotIndex * 2 < updatedSlots.length) {
      const startTime = updatedSlots[slotIndex * 2]
      if (newTime <= startTime) return // Invalid, don't update
    }
    
    updatedSlots[actualIndex] = newTime
    
    const newHours: WorkingHours = {
      ...workingHoursObj,
      [day]: updatedSlots
    }
    
    onChange(newHours)
  }

  const incrementTime = (time: string, hours: number): string => {
    const [hourStr] = time.split(':')
    let hour = parseInt(hourStr) + hours
    if (hour >= 24) hour -= 24
    if (hour < 0) hour += 24
    
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const getTimeSlots = (day: keyof WorkingHoursObject) => {
    const dayHours = workingHoursObj[day]
    if (dayHours === '24/7') return []
    if (!Array.isArray(dayHours)) return []
    
    const slots = []
    for (let i = 0; i < dayHours.length; i += 2) {
      if (dayHours[i] && dayHours[i + 1]) {
        slots.push({
          start: dayHours[i],
          end: dayHours[i + 1]
        })
      }
    }
    return slots
  }

  const handleDayToggle = (day: keyof WorkingHoursObject, checked: boolean) => {
    if (checked) {
      const newHours: WorkingHours = {
        ...workingHoursObj,
        [day]: ["08:00", "17:00"]
      }
      onChange(newHours)
    } else {
      const { [day]: removed, ...rest } = workingHoursObj
      onChange(rest)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-yellow-600" />
        <span className="font-semibold text-gray-900">Arbeitszeiten festlegen</span>
      </div>

      <div className="space-y-3">
        {DAYS.map((day) => {
          const dayHours = workingHoursObj[day.key]
          const is24_7 = dayHours === '24/7'
          const timeSlots = getTimeSlots(day.key)
          const isExpanded = expandedDay === day.key
          const isDayEnabled = day.key in workingHoursObj

          return (
            <div key={day.key} className="border-2 border-gray-300 rounded-xl overflow-hidden">
              {/* Day Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => setExpandedDay(isExpanded ? null : day.key)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDayEnabled}
                    onChange={(e) => handleDayToggle(day.key, e.target.checked)}
                    className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-semibold text-gray-900">{day.label}</span>
                </div>

                <div className="flex items-center gap-3">
                  {isDayEnabled && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`24-7-${day.key}`}
                          checked={is24_7}
                          onChange={(e) => {
                            e.stopPropagation()
                            handle24_7Toggle(day.key)
                          }}
                          className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label 
                          htmlFor={`24-7-${day.key}`}
                          className="text-sm text-gray-700 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          24/7
                        </label>
                      </div>
                      
                      {!is24_7 && timeSlots.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {timeSlots.map((slot, idx) => (
                            <span key={idx} className="bg-yellow-100 px-2 py-1 rounded">
                              {slot.start} - {slot.end}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {is24_7 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                          24 Stunden
                        </span>
                      )}
                    </>
                  )}
                  
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Time Slots (Expanded) */}
              {isExpanded && isDayEnabled && !is24_7 && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="space-y-4">
                    {timeSlots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(day.key, slotIndex, 0, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                          >
                            {TIME_SLOTS.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          
                          <span className="text-gray-500">bis</span>
                          
                          <select
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(day.key, slotIndex, 1, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                          >
                            {TIME_SLOTS.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(day.key, slotIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addTimeSlot(day.key)}
                      className="flex items-center gap-2 px-4 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors border border-yellow-300"
                    >
                      <Plus className="w-4 h-4" />
                      Weitere Zeitspanne hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Presets */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Schnelleinstellungen:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({
              mon: ["08:00", "17:00"],
              tue: ["08:00", "17:00"],
              wed: ["08:00", "17:00"],
              thu: ["08:00", "17:00"],
              fri: ["08:00", "17:00"],
              sat: ["09:00", "14:00"],
              sun: ["10:00", "13:00"]
            })}
            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Standard Bürozeiten
          </button>
          <button
            type="button"
            onClick={() => onChange('24/7')}
            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            Immer verfügbar (24/7)
          </button>
          <button
            type="button"
            onClick={() => onChange({})}
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Alle löschen
          </button>
        </div>
      </div>
    </div>
  )
}