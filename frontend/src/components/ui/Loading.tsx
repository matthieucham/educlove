import React from 'react'
import { cn } from '../../lib/utils'

interface SpinnerProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    color?: 'primary' | 'white' | 'gray' | 'current'
    className?: string
}

export const Spinner = ({
    size = 'md',
    color = 'primary',
    className
}: SpinnerProps) => {
    const sizes = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    }

    const colors = {
        primary: 'text-purple-600',
        white: 'text-white',
        gray: 'text-gray-600',
        current: 'text-current'
    }

    return (
        <svg
            className={cn(
                'animate-spin',
                sizes[size],
                colors[color],
                className
            )}
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
    )
}

interface LoadingOverlayProps {
    visible?: boolean
    message?: string
    fullScreen?: boolean
    blur?: boolean
    className?: string
}

export const LoadingOverlay = ({
    visible = true,
    message = 'Chargement...',
    fullScreen = false,
    blur = true,
    className
}: LoadingOverlayProps) => {
    if (!visible) return null

    const containerStyles = fullScreen
        ? 'fixed inset-0 z-50'
        : 'absolute inset-0 rounded-lg'

    return (
        <div
            className={cn(
                containerStyles,
                'flex items-center justify-center bg-white bg-opacity-75',
                blur && 'backdrop-blur-sm',
                className
            )}
        >
            <div className="flex flex-col items-center space-y-3">
                <Spinner size="lg" />
                {message && (
                    <p className="text-sm font-medium text-gray-700">{message}</p>
                )}
            </div>
        </div>
    )
}

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
    animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton = ({
    className,
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}: SkeletonProps) => {
    const baseStyles = 'bg-gray-200'

    const variants = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    }

    const animations = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: ''
    }

    const style: React.CSSProperties = {
        width: width || (variant === 'circular' ? 40 : '100%'),
        height: height || (variant === 'text' ? 20 : variant === 'circular' ? 40 : 100)
    }

    return (
        <div
            className={cn(
                baseStyles,
                variants[variant],
                animations[animation],
                className
            )}
            style={style}
        />
    )
}

interface LoadingDotsProps {
    size?: 'sm' | 'md' | 'lg'
    color?: 'primary' | 'white' | 'gray'
    className?: string
}

export const LoadingDots = ({
    size = 'md',
    color = 'primary',
    className
}: LoadingDotsProps) => {
    const sizes = {
        sm: 'h-1.5 w-1.5',
        md: 'h-2 w-2',
        lg: 'h-3 w-3'
    }

    const colors = {
        primary: 'bg-purple-600',
        white: 'bg-white',
        gray: 'bg-gray-600'
    }

    return (
        <div className={cn('flex space-x-1', className)}>
            {[0, 1, 2].map((index) => (
                <div
                    key={index}
                    className={cn(
                        'rounded-full animate-bounce',
                        sizes[size],
                        colors[color]
                    )}
                    style={{
                        animationDelay: `${index * 0.1}s`
                    }}
                />
            ))}
        </div>
    )
}

interface ProgressBarProps {
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    color?: 'primary' | 'success' | 'warning' | 'danger'
    showLabel?: boolean
    animated?: boolean
    className?: string
}

export const ProgressBar = ({
    value,
    max = 100,
    size = 'md',
    color = 'primary',
    showLabel = false,
    animated = false,
    className
}: ProgressBarProps) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizes = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-4'
    }

    const colors = {
        primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500'
    }

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
                <div
                    className={cn(
                        'h-full transition-all duration-500 ease-out',
                        colors[color],
                        animated && 'animate-pulse'
                    )}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    )
}

// Main Loading component that combines different loading states
interface LoadingProps {
    type?: 'spinner' | 'dots' | 'skeleton' | 'overlay'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    message?: string
    className?: string
}

const Loading = ({
    type = 'spinner',
    size = 'md',
    message,
    className
}: LoadingProps) => {
    const components = {
        spinner: <Spinner size={size} className={className} />,
        dots: <LoadingDots size={size as 'sm' | 'md' | 'lg'} className={className} />,
        skeleton: <Skeleton className={className} />,
        overlay: <LoadingOverlay message={message} className={className} />
    }

    return (
        <div className={cn('flex items-center justify-center', message && 'flex-col space-y-2')}>
            {components[type]}
            {message && type !== 'overlay' && (
                <p className="text-sm text-gray-600">{message}</p>
            )}
        </div>
    )
}

export default Loading
