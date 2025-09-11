import React, { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            id,
            required,
            disabled,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

        const baseStyles = 'w-full px-4 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent'

        const stateStyles = error
            ? 'border-red-400 text-red-900 placeholder-red-300 focus:ring-red-500 bg-red-50'
            : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 bg-white'

        const disabledStyles = disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''

        return (
            <div className={cn('space-y-1', fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={inputId}
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
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className={cn('text-gray-500', error && 'text-red-500')}>{leftIcon}</span>
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            baseStyles,
                            stateStyles,
                            disabledStyles,
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={
                            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                        }
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className={cn('text-gray-500', error && 'text-red-500')}>{rightIcon}</span>
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="text-sm text-red-600">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${inputId}-helper`} className="text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input
