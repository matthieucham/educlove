import React from 'react'
import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'md' | 'lg'
    rounded?: boolean
    removable?: boolean
    onRemove?: () => void
}

const Badge = ({
    children,
    className,
    variant = 'default',
    size = 'md',
    rounded = false,
    removable = false,
    onRemove,
    ...props
}: BadgeProps) => {
    const baseStyles = 'inline-flex items-center font-medium transition-all duration-200'

    const variants = {
        default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        primary: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 hover:from-purple-200 hover:to-pink-200',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        success: 'bg-green-100 text-green-800 hover:bg-green-200',
        warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        danger: 'bg-red-100 text-red-800 hover:bg-red-200',
        info: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    }

    const roundedStyles = rounded ? 'rounded-full' : 'rounded-md'

    return (
        <span
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                roundedStyles,
                className
            )}
            {...props}
        >
            {children}
            {removable && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-1.5 inline-flex items-center justify-center hover:opacity-75 focus:outline-none"
                    aria-label="Remove"
                >
                    <svg
                        className={cn(
                            'fill-current',
                            size === 'sm' && 'h-3 w-3',
                            size === 'md' && 'h-3.5 w-3.5',
                            size === 'lg' && 'h-4 w-4'
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            )}
        </span>
    )
}

// Chip component - similar to Badge but with more interactive features
interface ChipProps extends HTMLAttributes<HTMLDivElement> {
    label: string
    avatar?: ReactNode
    icon?: ReactNode
    variant?: 'filled' | 'outlined'
    color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'md' | 'lg'
    clickable?: boolean
    deletable?: boolean
    onDelete?: () => void
    selected?: boolean
}

export const Chip = ({
    label,
    avatar,
    icon,
    variant = 'filled',
    color = 'default',
    size = 'md',
    clickable = false,
    deletable = false,
    onDelete,
    selected = false,
    className,
    onClick,
    ...props
}: ChipProps) => {
    const baseStyles = 'inline-flex items-center font-medium transition-all duration-200 select-none'

    const sizes = {
        sm: 'h-6 px-2 text-xs rounded-md gap-1',
        md: 'h-8 px-3 text-sm rounded-lg gap-1.5',
        lg: 'h-10 px-4 text-base rounded-lg gap-2'
    }

    const colors = {
        default: {
            filled: 'bg-gray-200 text-gray-800',
            outlined: 'border-2 border-gray-300 text-gray-700'
        },
        primary: {
            filled: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
            outlined: 'border-2 border-purple-500 text-purple-600'
        },
        secondary: {
            filled: 'bg-gray-600 text-white',
            outlined: 'border-2 border-gray-600 text-gray-600'
        },
        success: {
            filled: 'bg-green-500 text-white',
            outlined: 'border-2 border-green-500 text-green-600'
        },
        warning: {
            filled: 'bg-yellow-500 text-white',
            outlined: 'border-2 border-yellow-500 text-yellow-600'
        },
        danger: {
            filled: 'bg-red-500 text-white',
            outlined: 'border-2 border-red-500 text-red-600'
        },
        info: {
            filled: 'bg-blue-500 text-white',
            outlined: 'border-2 border-blue-500 text-blue-600'
        }
    }

    const interactiveStyles = clickable
        ? 'cursor-pointer hover:shadow-md active:scale-95'
        : ''

    const selectedStyles = selected
        ? variant === 'filled'
            ? 'ring-2 ring-offset-2 ring-purple-500'
            : 'border-purple-600 bg-purple-50'
        : ''

    return (
        <div
            className={cn(
                baseStyles,
                sizes[size],
                colors[color][variant],
                interactiveStyles,
                selectedStyles,
                className
            )}
            onClick={clickable ? onClick : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            {...props}
        >
            {avatar && (
                <span className={cn(
                    'flex items-center justify-center rounded-full bg-white bg-opacity-30',
                    size === 'sm' && 'h-4 w-4',
                    size === 'md' && 'h-5 w-5',
                    size === 'lg' && 'h-6 w-6'
                )}>
                    {avatar}
                </span>
            )}
            {icon && !avatar && (
                <span className="flex items-center justify-center">
                    {icon}
                </span>
            )}
            <span>{label}</span>
            {deletable && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.()
                    }}
                    className="ml-auto -mr-1 hover:opacity-75 focus:outline-none"
                    aria-label="Delete"
                >
                    <svg
                        className={cn(
                            'fill-current',
                            size === 'sm' && 'h-3 w-3',
                            size === 'md' && 'h-4 w-4',
                            size === 'lg' && 'h-5 w-5'
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            )}
        </div>
    )
}

export default Badge
