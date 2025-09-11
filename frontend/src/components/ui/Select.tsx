import React, { forwardRef, useState, useRef, useEffect } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string
    error?: string
    helperText?: string
    options: SelectOption[]
    placeholder?: string
    fullWidth?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            options,
            placeholder = 'Sélectionner...',
            fullWidth = false,
            size = 'md',
            id,
            required,
            disabled,
            value,
            ...props
        },
        ref
    ) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

        const baseStyles = 'w-full appearance-none border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white cursor-pointer'

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm pr-8',
            md: 'px-4 py-2 text-base pr-10',
            lg: 'px-4 py-3 text-lg pr-10'
        }

        const stateStyles = error
            ? 'border-red-400 text-red-900 focus:ring-red-500 bg-red-50'
            : 'border-gray-300 text-gray-900 focus:ring-purple-500'

        const disabledStyles = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''

        return (
            <div className={cn('space-y-1', fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className={cn(
                            'block text-sm font-medium',
                            error ? 'text-red-700' : 'text-gray-700'
                        )}
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            baseStyles,
                            sizeStyles[size],
                            stateStyles,
                            disabledStyles,
                            className
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={
                            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
                        }
                        value={value}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                            className="h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>
                {error && (
                    <p id={`${selectId}-error`} className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${selectId}-helper`} className="text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

// Multi-select component with toggle buttons (like EditProfilePage)
interface MultiSelectProps {
    label?: string
    error?: string
    helperText?: string
    options: SelectOption[]
    value: string[]
    onChange: (values: string[]) => void
    fullWidth?: boolean
    disabled?: boolean
    required?: boolean
}

export const MultiSelect = ({
    label,
    error,
    helperText,
    options,
    value = [],
    onChange,
    fullWidth = false,
    disabled = false,
    required = false
}: MultiSelectProps) => {
    const handleToggle = (optionValue: string) => {
        if (disabled) return

        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue]
        onChange(newValue)
    }

    return (
        <div className={cn('space-y-2', fullWidth && 'w-full')}>
            {label && (
                <label className={cn(
                    'block text-sm font-medium',
                    error ? 'text-red-700' : 'text-gray-700'
                )}>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => !option.disabled && handleToggle(option.value)}
                        disabled={disabled || option.disabled}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                            value.includes(option.value)
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-purple-100 border border-gray-300',
                            (disabled || option.disabled) && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    )
}

export default Select
