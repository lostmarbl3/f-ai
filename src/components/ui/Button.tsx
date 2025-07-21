import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent' | 'success';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
    const baseClasses = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary-light',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
        danger: 'bg-danger text-white hover:bg-danger-light focus:ring-danger-light',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-700',
        accent: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent',
        success: 'bg-success text-white hover:bg-green-700 focus:ring-green-500',
    };

    const sizeClasses = {
        sm: 'py-1.5 px-3 text-sm',
        md: 'py-2 px-4 text-base',
        lg: 'py-3 px-6 text-lg',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;