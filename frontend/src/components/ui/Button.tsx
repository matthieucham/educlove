import React, { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    fullWidth?: boolean
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            disabled,
            leftIcon,
            rightIcon,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

        const variants = {
            primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500',
            secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
            outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
            ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
            success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
        }

        const sizes = {
            sm: 'px-3 py-1.5 text-sm rounded-md',
            md: 'px-4 py-2 text-base rounded-lg',
            lg: 'px-6 py-3 text-lg rounded-lg',
            xl: 'px-8 py-4 text-xl rounded-xl'
        }

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Chargement...
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="mr-2">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="ml-2">{rightIcon}</span>}
                    </>
                )}
            </button>
        )
    }
)

Button.displayName = 'Button'

export default Button
