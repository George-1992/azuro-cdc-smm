'use client';

import React, { isValidElement, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/libs/utils';


const recursivlyFindChild = (children, predicate) => {
    let result = null;
    React.Children.forEach(children, (child) => {
        if (!child) return;
        if (result) return; // already found
        if (predicate(child)) {
            result = child;
        } else if (child.props && child.props.children) {
            result = recursivlyFindChild(child.props.children, predicate);
        }
    });
    return result;
};

// Base Modal Component with Backdrop
const ModalBase = ({ isOpen, onClose, children, className = '', backdropClassName = '' }) => {
    const modalRef = useRef(null);

    // find in children the element with data-type="fixed-buttons"
    const fixedButtonsEl = recursivlyFindChild(children, (child) => {
        // log child className
        // console.log('child className: ', child?.props?.className);

        return null
        // return isValidElement(child) && child.props['data-type'] === 'fixed-buttons';
    });

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

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key !== 'Escape' || !isOpen) return;
            if (!modalRef.current) {
                onClose();
                return;
            }
            try {
                const isInsideModal =
                    modalRef.current.contains(e.target) ||
                    modalRef.current.contains(document.activeElement) ||
                    (typeof e.composedPath === 'function' &&
                        e.composedPath().some(node => node === modalRef.current));
                if (isInsideModal) return;
            } catch (err) {
                return;
            }
            onClose();
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

    // Handle modal visibility and animations
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            // Wait for close animation to complete before hiding
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle backdrop click with drag protection
    const handleBackdropMouseDown = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            const handleMouseUp = (upEvent) => {
                if (modalRef.current && !modalRef.current.contains(upEvent.target)) {
                    onClose();
                }
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mouseup', handleMouseUp);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 transition-all duration-300 ease-in-out",
                isOpen
                    ? "bg-black/50 backdrop-blur-sm"
                    : "bg-black/0 backdrop-blur-none",
                backdropClassName
            )}
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={modalRef}
                className={cn(
                    "fixed top-0 right-0 h-full w-[80%] max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with close button */}
                <div className={cn(
                    "flex items-center justify-between p-4 border-b border-gray-200 transition-opacity duration-300 ease-out",
                    isOpen ? "opacity-100" : "opacity-0"
                )}>
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
                <div className={cn(
                    "p-4 h-full overflow-auto transition-opacity duration-300 ease-out",
                    isOpen ? "opacity-100" : "opacity-0"
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
};


 

// Export default for convenience
export default { PopupModal, ExpandableModal };
