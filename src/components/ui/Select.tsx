import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <select
                id={id}
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                {...props}
            >
                {children}
            </select>
        </div>
    );
};

export default Select;