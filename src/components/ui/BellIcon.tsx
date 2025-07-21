
import React from 'react';

interface BellIconProps {
    hasNotification: boolean;
    onClick: () => void;
}

const BellIcon: React.FC<BellIconProps> = ({ hasNotification, onClick }) => (
    <button onClick={onClick} className="relative text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200 transition-colors" aria-label="View notifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        {hasNotification && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white"></span>}
    </button>
);

export default BellIcon;