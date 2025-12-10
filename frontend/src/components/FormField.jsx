import React from 'react';

const FormField = ({ icon, label, description, children }) => (
    <div>
        <label className="text-sm font-medium text-base-content/60">{label}</label>
        <div className="flex items-center gap-3 mt-1">
            <div className="shrink-0">{icon}</div>
            <div className="w-full">
                {children} {/* This is where the <input> or <select> will go */}
            </div>
        </div>
        {description && <p className="text-xs text-base-content/50 mt-1 ml-9">{description}</p>}
    </div>
);

export default FormField;