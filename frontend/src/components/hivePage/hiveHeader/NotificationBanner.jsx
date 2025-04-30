import { useEffect, useState } from 'react';

export default function NotificationBanner({ message, type, onClose }) {
    const [visible, setVisible] = useState(true);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => {
                setVisible(false);
                onClose?.();
            }, 500);
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    const baseStyle = `fixed top-[70px] left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg text-sm font-medium z-50 transition-all duration-500 ease-in-out backdrop-blur`;
    const animationStyle = exiting
        ? 'opacity-0 -translate-y-12'
        : 'opacity-100 translate-y-0';

    const typeStyle = type === 'danger'
        ? 'bg-red-600 text-white'
        : 'bg-amber-400 bg-opacity-80 text-black';

    return (
        <div className={`${baseStyle} ${typeStyle} ${animationStyle}`}>
            {message}
        </div>
    );
}
