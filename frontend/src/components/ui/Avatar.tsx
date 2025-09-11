import React from 'react'
import type { ImgHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
    src?: string
    alt?: string
    fallback?: string | React.ReactNode
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    shape?: 'circle' | 'square'
    status?: 'online' | 'offline' | 'away' | 'busy'
    statusPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
    border?: boolean
}

const Avatar = ({
    src,
    alt = 'Avatar',
    fallback,
    size = 'md',
    shape = 'circle',
    status,
    statusPosition = 'bottom-right',
    border = false,
    className,
    ...props
}: AvatarProps) => {
    const [imageError, setImageError] = React.useState(false)

    const sizes = {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-14 w-14 text-xl',
        '2xl': 'h-16 w-16 text-2xl'
    }

    const statusSizes = {
        xs: 'h-2 w-2',
        sm: 'h-2.5 w-2.5',
        md: 'h-3 w-3',
        lg: 'h-3.5 w-3.5',
        xl: 'h-4 w-4',
        '2xl': 'h-5 w-5'
    }

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500'
    }

    const statusPositions = {
        'top-right': 'top-0 right-0',
        'bottom-right': 'bottom-0 right-0',
        'top-left': 'top-0 left-0',
        'bottom-left': 'bottom-0 left-0'
    }

    const shapeStyles = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
    const borderStyles = border ? 'ring-2 ring-white' : ''

    const renderFallback = () => {
        if (typeof fallback === 'string') {
            // If fallback is a string, use it as initials
            const initials = fallback
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

            return (
                <div
                    className={cn(
                        'flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold',
                        sizes[size],
                        shapeStyles,
                        borderStyles,
                        className
                    )}
                >
                    {initials}
                </div>
            )
        } else if (fallback) {
            // If fallback is a ReactNode, render it directly
            return (
                <div
                    className={cn(
                        'flex items-center justify-center bg-gray-200',
                        sizes[size],
                        shapeStyles,
                        borderStyles,
                        className
                    )}
                >
                    {fallback}
                </div>
            )
        } else {
            // Default fallback with user icon
            return (
                <div
                    className={cn(
                        'flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500',
                        sizes[size],
                        shapeStyles,
                        borderStyles,
                        className
                    )}
                >
                    <svg
                        className="h-[60%] w-[60%] text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )
        }
    }

    return (
        <div className="relative inline-block">
            {src && !imageError ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setImageError(true)}
                    className={cn(
                        'object-cover',
                        sizes[size],
                        shapeStyles,
                        borderStyles,
                        className
                    )}
                    {...props}
                />
            ) : (
                renderFallback()
            )}
            {status && (
                <span
                    className={cn(
                        'absolute block rounded-full ring-2 ring-white',
                        statusSizes[size],
                        statusColors[status],
                        statusPositions[statusPosition]
                    )}
                    aria-label={`Status: ${status}`}
                />
            )}
        </div>
    )
}

// AvatarGroup component for displaying multiple avatars
interface AvatarGroupProps {
    children: React.ReactNode
    max?: number
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    spacing?: 'tight' | 'normal' | 'loose'
}

export const AvatarGroup = ({
    children,
    max = 3,
    size = 'md',
    spacing = 'normal'
}: AvatarGroupProps) => {
    const childrenArray = React.Children.toArray(children)
    const visibleChildren = childrenArray.slice(0, max)
    const remainingCount = childrenArray.length - max

    const spacingStyles = {
        tight: '-space-x-2',
        normal: '-space-x-3',
        loose: '-space-x-4'
    }

    const sizes = {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-14 w-14 text-xl',
        '2xl': 'h-16 w-16 text-2xl'
    }

    return (
        <div className={cn('flex items-center', spacingStyles[spacing])}>
            {visibleChildren.map((child, index) => (
                <div
                    key={index}
                    className="relative inline-block ring-2 ring-white rounded-full"
                    style={{ zIndex: visibleChildren.length - index }}
                >
                    {React.isValidElement(child) &&
                        React.cloneElement(child as React.ReactElement<AvatarProps>, {
                            size,
                            border: false
                        })}
                </div>
            ))}
            {remainingCount > 0 && (
                <div
                    className={cn(
                        'relative inline-flex items-center justify-center bg-gray-300 text-gray-700 font-semibold rounded-full ring-2 ring-white',
                        sizes[size]
                    )}
                    style={{ zIndex: 0 }}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    )
}

export default Avatar
