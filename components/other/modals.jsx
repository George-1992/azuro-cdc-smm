'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// Base Modal Component with Backdrop
const ModalBase = ({ isOpen, onClose, children, className = '', backdropClassName = '' }) => {
    const modalRef = useRef(null);

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
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

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
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
            onClick={handleBackdropClick}
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
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
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
            setIsAnimating(true);
            // Small delay to ensure DOM is ready for animation
            setTimeout(() => setIsAnimating(false), 50);
        } else if (isVisible) {
            setIsAnimating(true);
            // Wait for animation to complete before hiding
            setTimeout(() => {
                setIsVisible(false);
                setIsAnimating(false);
            }, 300);
        }
    }, [isOpen, isVisible]);

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-200 ease-in-out ${isOpen && !isAnimating
                    ? 'bg-black/50 backdrop-blur-sm'
                    : 'bg-black/0 backdrop-blur-none'
                } ${backdropClassName}`}
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={`fixed top-0 right-0 h-full w-[80%] max-w-2xl bg-white shadow-2xl transform transition-all duration-200 ease-in-out overflow-hidden ${isOpen && !isAnimating
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-90'
                    } ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with close button */}
                <div className={`flex items-center justify-between p-4 border-b border-gray-200 transform transition-all duration-200 delay-100 ease-out ${isOpen && !isAnimating
                        ? 'translate-y-0 opacity-100'
                        : '-translate-y-2 opacity-0'
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
                <div className={`p-4 h-full overflow-auto transform transition-all duration-200 delay-150 ease-out ${isOpen && !isAnimating
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                    }`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Export default for convenience
export default { PopupModal, ExpandableModal };
