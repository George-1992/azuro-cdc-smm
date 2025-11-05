'use client';
import React, { useState, createContext, useContext } from 'react';

// Create context for tabs state
const TabsContext = createContext();

// Main Tabs component
export const Tabs = ({ 
    children, 
    defaultValue,
    value: controlledValue,
    onValueChange,
    className = '' 
}) => {

    // if not defined, use first child's value as default
    let _defaultValue = defaultValue;
    if (_defaultValue === undefined && React.Children.count(children) > 0) {
        const firstChild = React.Children.toArray(children).find(child => React.isValidElement(child) && child.props.value !== undefined);
        _defaultValue = firstChild.props.value;
    }
    const [internalValue, setInternalValue] = useState(_defaultValue);

    const isControlled = controlledValue !== undefined;
    const activeValue = isControlled ? controlledValue : internalValue;
    
    const handleValueChange = (newValue) => {
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ activeValue, onValueChange: handleValueChange }}>
            <div className={`w-full ${className}`} data-orientation="horizontal" role="tablist">
                {children}
            </div>
        </TabsContext.Provider>
    );
};

// Tabs list container for tab triggers
export const TabsList = ({ children, className = '' }) => {
    return (
        <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
            {children}
        </div>
    );
};

// Individual tab trigger
export const TabsTrigger = ({ 
    children, 
    value, 
    disabled = false,
    className = '' 
}) => {
    const context = useContext(TabsContext);
    
    if (!context) {
        throw new Error('TabsTrigger must be used within a Tabs component');
    }
    
    const { activeValue, onValueChange } = context;
    const isActive = activeValue === value;
    
    return (
        <button
            className={`
                inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 
                text-sm font-medium ring-offset-white transition-all 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                disabled:pointer-events-none disabled:opacity-50
                ${isActive 
                    ? 'bg-white text-gray-950 shadow-sm' 
                    : 'hover:bg-gray-200 hover:text-gray-900'
                }
                ${className}
            `}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabcontent-${value}`}
            data-state={isActive ? 'active' : 'inactive'}
            disabled={disabled}
            onClick={() => !disabled && onValueChange(value)}
        >
            {children}
        </button>
    );
};

// Tab content panel
export const TabsContent = ({ 
    children, 
    value,
    className = '' 
}) => {
    const context = useContext(TabsContext);
    
    if (!context) {
        throw new Error('TabsContent must be used within a Tabs component');
    }
    
    const { activeValue } = context;
    const isActive = activeValue === value;
    
    if (!isActive) {
        return null;
    }
    
    return (
        <div
            className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
            role="tabpanel"
            aria-labelledby={`tab-${value}`}
            id={`tabcontent-${value}`}
            tabIndex={0}
        >
            {children}
        </div>
    );
};

// Legacy components for backward compatibility (optional)
export const TabContainer = Tabs;
export const Tab = ({ children, label }) => (
    <>
        <TabsTrigger value={label.toLowerCase().replace(/\s+/g, '-')}>
            {label}
        </TabsTrigger>
        <TabsContent value={label.toLowerCase().replace(/\s+/g, '-')}>
            {children}
        </TabsContent>
    </>
);
