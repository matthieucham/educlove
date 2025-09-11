import React, { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import Button from './Button'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    closeOnOverlayClick?: boolean
    showCloseButton?: boolean
    className?: string
}

const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    description,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    className
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4'
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className={cn(
                        'relative bg-white rounded-2xl shadow-xl transform transition-all w-full',
                        sizes[size],
                        className
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                    aria-describedby={description ? 'modal-description' : undefined}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-start justify-between p-6 border-b border-gray-200">
                            <div>
                                {title && (
                                    <h3 id="modal-title" className="text-xl font-semibold text-gray-900">
                                        {title}
                                    </h3>
                                )}
                                {description && (
                                    <p id="modal-description" className="mt-1 text-sm text-gray-600">
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="ml-auto -mr-2 -mt-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="Fermer"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Modal Footer component for consistent styling
interface ModalFooterProps {
    children: ReactNode
    className?: string
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
    return (
        <div className={cn(
            'flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6 -mx-6 px-6',
            className
        )}>
            {children}
        </div>
    )
}

// Confirmation Modal - a pre-configured modal for confirmations
interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'danger'
}: ConfirmModalProps) => {
    const variantStyles = {
        danger: 'danger',
        warning: 'primary',
        info: 'primary'
    } as const

    const variantIcons = {
        danger: (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
        ),
        warning: (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            </div>
        ),
        info: (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
            </div>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
            <div className="text-center">
                {variantIcons[variant]}
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
            <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                    {cancelText}
                </Button>
                <Button variant={variantStyles[variant]} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default Modal
