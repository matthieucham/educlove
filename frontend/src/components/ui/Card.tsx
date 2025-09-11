import React from 'react'
import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    variant?: 'default' | 'bordered' | 'elevated' | 'gradient'
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
}

const Card = ({
    children,
    className,
    variant = 'default',
    padding = 'md',
    ...props
}: CardProps) => {
    const baseStyles = 'bg-white rounded-xl overflow-hidden'

    const variants = {
        default: 'shadow-md',
        bordered: 'border-2 border-gray-200',
        elevated: 'shadow-xl',
        gradient: 'bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
    }

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
    }

    return (
        <div
            className={cn(
                baseStyles,
                variants[variant],
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

const CardHeader = ({ children, className, ...props }: CardSectionProps) => {
    return (
        <div
            className={cn(
                'pb-4 border-b border-gray-200',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

const CardTitle = ({ children, className, ...props }: CardSectionProps) => {
    return (
        <h3
            className={cn(
                'text-xl font-semibold text-gray-800',
                className
            )}
            {...props}
        >
            {children}
        </h3>
    )
}

const CardDescription = ({ children, className, ...props }: CardSectionProps) => {
    return (
        <p
            className={cn(
                'text-sm text-gray-600 mt-1',
                className
            )}
            {...props}
        >
            {children}
        </p>
    )
}

const CardContent = ({ children, className, ...props }: CardSectionProps) => {
    return (
        <div
            className={cn(
                'py-4',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

const CardFooter = ({ children, className, ...props }: CardSectionProps) => {
    return (
        <div
            className={cn(
                'pt-4 border-t border-gray-200 flex items-center justify-between',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

// Attach compound components
Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
