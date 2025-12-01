'use client';

import { cn } from '@/libs/utils';
import { XIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { isValidElement } from 'react';

// Modal store and state management
let __modalStore = [];
let __modalId = 0;
const __modalListeners = new Set();

// Internal modal addition with proper error handling
export const addModalInternal = (modal) => {
    try {
        const {
            id: providedId, name, title, callback,
            component, onClose, onSave,
            type = 'popup', buttons, scrollable = true, className
        } = modal || {};
        console.debug('[addModalInternal] incoming:', { providedId, name, component });

        // Compute a stable dedupe key: prefer providedId, then name, then component displayName/name
        const componentId = (component && (component.displayName || component.name)) || null;
        const dedupeKey = providedId != null ? `id:${providedId}` : (name ? `name:${name}` : (componentId ? `comp:${componentId}` : null));

        if (dedupeKey) {
            const existing = __modalStore.find((m) => m._dedupeKey === dedupeKey);
            if (existing) {
                console.debug('[addModalInternal] duplicate detected by key, returning existing:', dedupeKey);
                const handle = { id: existing.id, close: () => removeModal(existing.id) };
                try { if (typeof callback === 'function') callback(handle); } catch (err) { console.warn('addModal callback error', err); }
                return handle;
            }
        }

        // Use provided id or generate a new one
        const id = (providedId !== undefined && providedId !== null) ? providedId : ++__modalId;

        const entry = {
            id, name, title, callback, component, type,
            onClose, onSave, _dedupeKey: dedupeKey,
            buttons, scrollable, className
        };
        __modalStore = [...__modalStore, entry];

        // Notify all listeners
        __modalListeners.forEach((fn) => fn(__modalStore));

        const handle = {
            id,
            close: () => removeModal(id),
        };

        try {
            if (typeof callback === 'function') callback(handle);
        } catch (err) {
            console.warn('addModal callback error', err);
        }

        return handle;
    } catch (err) {
        console.error('addModalInternal error', err);
        return null;
    }
};

// Remove modal by ID
export const removeModal = (id) => {
    __modalStore = __modalStore.filter((m) => m.id !== id);
    __modalListeners.forEach((fn) => fn(__modalStore));
};

// Backwards-compatible exported function 
export const addModal = (options) => {

    // {
    //     id, type, title, component, buttons,
    //         scrollable = true, onClose, onSave, className
    // }
    try {
        return addModalInternal(options);
    } catch (error) {
        console.error('Error adding modal: ', error);
        return null;
    }
};

// Get current modal store (for debugging)
export const getModalStore = () => [...__modalStore];

// Clear all modals
export const clearAllModals = () => {
    __modalStore = [];
    __modalListeners.forEach((fn) => fn(__modalStore));
};

// Modal Container Component
export const ModalContainer = ({ className = '' }) => {
    const [modals, setModals] = useState(__modalStore);

    useEffect(() => {
        try {
            const handler = (list) => setModals([...list]);
            __modalListeners.add(handler);
            handler(__modalStore);

            return () => __modalListeners.delete(handler);
        } catch (error) {
            console.error('Error in ModalContainer useEffect: ', error);
        }
    }, []);
    const handleBackdropClick = () => {
        const last = modals[modals.length - 1];
        if (last) {
            removeModal(last.id)
            if (last.onClose) {
                last.onClose();
            }
        }
    };
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape' && modals.length > 0) {
            const last = modals[modals.length - 1];
            if (last) {
                removeModal(last.id)
                if (last.onClose) {
                    last.onClose();
                }
            }
        }
    };
    // Add escape key listener
    useEffect(() => {
        if (modals.length > 0) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [modals.length]);



    const renderModalContent = (modal, index) => {
        if (!modal) return null;
        const id = modal.id;
        const Component = modal.component;
        const scrollable = modal.scrollable !== false;
        const className = modal.className || '';
        const isLast = index === modals.length - 1;
        // console.log('modal: ', modal);


        // if (isValidElement(Component)) {
        //     return React.cloneElement(Component, {
        //         key: id,
        //         onClose: () => removeModal(id)
        //     });
        // }

        const handleThisClose = () => {
            // () => removeModal(id)
            // console.log('modal.onClose: ', modal.onClose);

            if (modal.onClose) {
                modal.onClose();
            }
        };

        if (typeof Component === 'function') {

            let s = {};
            if (index > 0) {
                s = {
                    top: `${3 + (index * 0.05)}rem`,
                    // scale: `${1 - (index * 0.005)}`,
                    // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                };
            }
            return <div
                className={cn(
                    '',
                    index > 0 ? `absolute translate-x-full border border-gray-200` : 'relative',
                    'modal p-3 bg-white shadow-lg overflow-hidden flex flex-col',
                    !isLast && 'opacity-50 pointer-events-none',
                    modal.type === 'popup' && 'w-[550px] h-4/6 lg:h-[580px] mt-20 ml-auto mr-auto rounded-lg',
                    modal.type === 'expandable' && 'h-full w-11/12 md:w-[1000px] ml-auto rounded-l-sm',
                )}
                style={s}
            >
                {/* header */}
                <div className="">
                    <div className='w-full flex justify-between items-center mb-2 border-b border-gray-200'>
                        <p className="text-lg font-medium">
                            {modal.title || ''}
                        </p>
                        <button
                            onClick={handleThisClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-100"
                            aria-label="Close modal"
                        >
                            <XIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* body */}
                <div className={cn(
                    'flex-grow py-2',
                    scrollable ? 'overflow-auto ' : 'overflow-hidden'
                )}>
                    <Component key={id} onClose={() => removeModal(id)} />
                </div>

                {/* footer */}
                {modal.buttons && modal.buttons.length > 0 &&
                    <div className="w-full justify-end flex gap-3 my-2">
                        <div className='w-fullm-auto border-t border-gray-200'></div>

                        {
                            (modal.buttons || []).map((button, index) => (
                                <button
                                    key={index}
                                    className={button.className}
                                    onClick={button.onClick}
                                    type={button.type || 'button'}
                                >
                                    {button.label}
                                </button>
                            ))
                        }
                    </div>
                }

            </div>;
        }

        return null;
    };

    if (modals.length === 0) return null;

    console.log('modals: ', modals);

    return (
        <div className={`w-full h-full fixed inset-0 z-50 ${className}`}>
            {/* Backdrop */}
            <div
                className="w-full fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
            />

            {/* Modals */}
            {modals.map((modal, index) => (
                <div
                    className="w-full h-full"
                    key={modal.id || modal.name || index}
                >
                    {renderModalContent(modal, index)}
                </div>
            ))}
        </div>
    );
};

// Hook for using modals in components
export const useModal = () => {
    return {
        addModal: (options) => addModal(options),
        removeModal: (id) => removeModal(id),
        clearAllModals: () => clearAllModals(),
    };
};

// Pre-built modal components for common use cases
export const ConfirmModal = ({
    title = "Confirm",
    message = "Are you sure?",
    onConfirm,
    onCancel,
    onClose,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default"
}) => {
    const handleConfirm = () => {
        onConfirm?.();
        onClose?.();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose?.();
    };

    const variantStyles = {
        default: "bg-blue-600 hover:bg-blue-700",
        danger: "bg-red-600 hover:bg-red-700",
        warning: "bg-yellow-600 hover:bg-yellow-700",
        success: "bg-green-600 hover:bg-green-700",
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="flex justify-end space-x-3">
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={handleConfirm}
                    className={`px-4 py-2 text-white rounded transition-colors ${variantStyles[variant]}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
};

// Utility function for quick confirm modals
export const showConfirm = (options) => {
    return new Promise((resolve) => {
        const { title, message, confirmText, cancelText, variant } = options;

        addModal({
            component: ({ onClose }) => (
                <ConfirmModal
                    title={title}
                    message={message}
                    confirmText={confirmText}
                    cancelText={cancelText}
                    variant={variant}
                    onConfirm={() => resolve(true)}
                    onCancel={() => resolve(false)}
                    onClose={onClose}
                />
            )
        });
    });
};