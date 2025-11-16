'use client';
import { useState, useEffect, cloneElement, Children } from "react";
import { cn } from "@/libs/utils";

export const ButtonGroup = ({
    children,
    defaultValue = null,
    onChange = () => { },
    className = '',
    variant = 'default' // 'default', 'segmented'
}) => {
    const [activeValue, setActiveValue] = useState(defaultValue);

    useEffect(() => {
        setActiveValue(defaultValue);
    }, [defaultValue]);

    const handleValueChange = (value) => {
        setActiveValue(value);
        onChange(value);
    };

    const groupClasses = cn(
        "flex",
        variant === 'segmented'
            ? "border border-gray-300 rounded-md overflow-hidden"
            : "border border-gray-300 rounded-md shadow-sm",
        className
    );

    return (
        <div className={groupClasses} role="group">
            {Children.map(children, (child, index) => {
                if (!child) return null;

                return cloneElement(child, {
                    ...child.props,
                    isActive: child.props.value === activeValue,
                    onSelect: () => handleValueChange(child.props.value),
                    variant: variant,
                    isFirst: index === 0,
                    isLast: index === Children.count(children) - 1,
                    key: child.props.value || index
                });
            })}
        </div>
    );
};

export const ButtonGroupButton = ({
    value,
    children,
    isActive = false,
    onSelect = () => { },
    disabled = false,
    className = '',
    variant = 'default',
    isFirst = false,
    isLast = false,
    size = 'md' // 'sm', 'md', 'lg'
}) => {
    const sizeClasses = {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base"
    };

    const baseClasses = cn(
        "transition-all duration-200 font-medium focus:ring-0",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed"
    );

    const variantClasses = variant === 'segmented'
        ? cn(
            "border-r border-gray-300 first:border-l-0 last:border-r-0",
            isActive
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50",
        )
        : cn(
            isFirst && "rounded-l-md",
            isLast && "rounded-r-md",
            isActive
                ? "bg-gray-300 text-white border-blue-500 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        );

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={cn(baseClasses, variantClasses, className)}
        >
            {children}
        </button>
    );
};