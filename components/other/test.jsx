'use client';

import { cn } from "@/libs/utils";
import { useEffect } from "react";

// Separate named export for the buttons
export const ModalButtons = ({ className, children }) => {
  return (
    <div className={cn('modal-buttons mt-6 flex gap-3 justify-end', className)}>
      {children}
    </div>
  );
};

// Attach it as a static property so we can detect it later
Modal.Buttons = ModalButtons;

export const Modal = ({
  isOpen,
  onClose,
  className,
  children,
}) => {
  if (!isOpen) return null;

  // Separate regular content from Modal.Buttons
  const regularChildren = [];
  let buttonsChild = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      regularChildren.push(child);
      return;
    }

    // Check if this child is <Modal.Buttons ...>
    if (child.type === Modal.Buttons) {
      buttonsChild = child;
    } else {
      regularChildren.push(child);
    }
  });

  return (
    <div className={cn('modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50', className)}>
      <div 
        className="modal-content bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
      >
        {/* Main content (everything except Modal.Buttons) */}
        {regularChildren}

        {/* ModalButtons automatically appear here at the bottom if used */}
        {buttonsChild}

        {/* Optional: fallback close button if no Modal.Buttons */}
        {!buttonsChild && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};