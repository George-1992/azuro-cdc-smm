'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// Base Modal Component with Backdrop
const ModalBase = ({ isOpen, onClose, children, className = '', backdropClassName = '' }) => {
    const modalRef = useRef(null);

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key !== 'Escape' || !isOpen) return;
            if (!modalRef.current) {
                onClose();
                return;
            }
            // If the event target is inside the modal, ignore it
            try {
                if (modalRef.current.contains(e.target)) return;
                // If the currently focused element is inside the modal, ignore it
                if (modalRef.current.contains(document.activeElement)) return;
                // For shadow DOM / composed events, check the composed path
                if (typeof e.composedPath === 'function' && e.composedPath().includes(modalRef.current)) return;
            } catch (err) {
                // If anything goes wrong with checks, don't close unexpectedly
                return;
            }
            onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle backdrop mousedown (fixes text selection issue)
    const handleBackdropMouseDown = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            const handleMouseUp = (upEvent) => {
                // Only close if mouseup also happens outside the modal
                if (modalRef.current && !modalRef.current.contains(upEvent.target)) {
                    onClose();
                }
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mouseup', handleMouseUp);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`
                fixed inset-0 pt-10 md:pt-20 z-50 
                flex items-start justify-center 
                 bg-black/50 backdrop-blur-sm ${backdropClassName}
            `}
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={modalRef}
                className={`relative slide-up-once-modal bg-white rounded-lg shadow-xl max-h-[80vh] overflow-auto ${className} slick-scroll`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

// Popup Modal Component
export const PopupModal = ({
    isOpen,
    onClose,
    children,
    title,
    size = 'md',
    showCloseButton = true,
    className = '',
    backdropClassName = ''
}) => {
    const sizeClasses = {
        sm: 'w-full max-w-sm mx-4',
        md: 'w-full max-w-md mx-4',
        lg: 'w-full max-w-lg mx-4',
        xl: 'w-full max-w-xl mx-4',
        '2xl': 'w-full max-w-2xl mx-4',
        full: 'w-full max-w-4xl mx-4'
    };

    return (
        <ModalBase
            isOpen={isOpen}
            onClose={onClose}
            className={`${className ? className : sizeClasses[size]}`}
            backdropClassName={backdropClassName}
        >
            {/* Header with close button */}
            <div className="flex p-2 h-11 items-center justify-between  border-b border-gray-200">
                {title && (
                    <h2 className="text-lg flex-shrink-0 font-semibold text-gray-500">
                        {title}
                    </h2>
                )}
                {showCloseButton && (
                    <div className='w-full flex justify-end'>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-100"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-2">
                {children}
            </div>
        </ModalBase>
    );
};

// Expandable Modal Component - Slides from right
export const ExpandableModal = ({
    isOpen,
    onClose,
    children,
    title,
    showCloseButton = true,
    className = '',
    backdropClassName = ''
}) => {
    const modalRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key !== 'Escape' || !isOpen) return;

            // If modal ref doesn't exist yet, close immediately
            if (!modalRef.current) {
                onClose();
                return;
            }

            // Check if escape should be ignored (focus or interaction within modal)
            try {
                const isInsideModal =
                    // Current event target is inside modal
                    modalRef.current.contains(e.target) ||
                    // Currently focused element is inside modal
                    modalRef.current.contains(document.activeElement) ||
                    // For shadow DOM support
                    (typeof e.composedPath === 'function' &&
                        e.composedPath().some(node => node === modalRef.current));

                if (isInsideModal) return;
            } catch (err) {
                // If anything goes wrong with DOM checks, be safe and don't close
                console.warn('Error checking modal containment:', err);
                return;
            }

            // Only close if escape was pressed outside the modal
            onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent background scroll

            // Optional: Focus trap for better accessibility
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements && focusableElements.length > 0) {
                focusableElements[0]?.focus();
            }
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle modal animations
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Use requestAnimationFrame for smoother animation start
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else if (isVisible) {
            setIsAnimating(false);
            // Wait for animation to complete before hiding
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300); // Match this with your CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen, isVisible]);

    // Handle backdrop click with drag protection
    const handleBackdropMouseDown = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            const handleMouseUp = (upEvent) => {
                // Only close if mouseup also happens outside the modal
                if (modalRef.current && !modalRef.current.contains(upEvent.target)) {
                    onClose();
                }
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mouseup', handleMouseUp);
        }
    };

    // Early return if not visible and not animating
    if (!isVisible && !isAnimating) return null;

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${isOpen && isAnimating
                    ? 'bg-black/50 backdrop-blur-sm'
                    : 'bg-black/0 backdrop-blur-none pointer-events-none'
                } ${backdropClassName}`}
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={modalRef}
                className={`fixed top-0 right-0 h-full w-[80%] max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden ${isOpen && isAnimating
                        ? 'translate-x-0'
                        : 'translate-x-full'
                    } ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with close button */}
                <div className={`flex items-center justify-between p-4 border-b border-gray-200 transition-all duration-300 ease-out ${isOpen && isAnimating
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}>
                    {title && (
                        <h2 className="text-xl font-semibold text-gray-900">
                            {title}
                        </h2>
                    )}
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 hover:scale-110 rounded-full transition-all duration-100"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className={`p-4 h-full overflow-auto transition-all duration-300 ease-out ${isOpen && isAnimating
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Export default for convenience
export default { PopupModal, ExpandableModal };
