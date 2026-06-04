'use client'

import React from 'react'
import { Check } from 'lucide-react'

interface Step {
  id: number
  label: string
  description?: string
}

interface StepsProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Steps({ steps, currentStep, className = '' }: StepsProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors
                    ${isCompleted
                      ? 'bg-brand-950 text-white'
                      : isCurrent
                      ? 'bg-brand-100 text-brand-900 border-2 border-brand-900'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${isCurrent ? 'text-brand-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{step.description}</p>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mt-5 mx-2 transition-colors ${isCompleted ? 'bg-brand-950' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
