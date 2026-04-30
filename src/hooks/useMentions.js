import { useState, useCallback, useRef } from 'react';
import { getSiguiendo, getSeguidores } from '../api/user';

export default function useMentions() {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef(null);

    const loadUsers = useCallback(async () => {
        try {
            const [following, followers] = await Promise.all([
                getSiguiendo(),
                getSeguidores()
            ]);

            const merged = [...following, ...followers];
            const unique = Array.from(
                new Map(merged.map(u => [u._id, u])).values()
            );
            setAllUsers(unique);
        } catch (error) {
            console.error("Error loading connections for mentions:", error);
        }
    }, []);

    const handleTextChange = (text, position) => {
        setCursorPosition(position);

        const beforeCursor = text.slice(0, position);
        const lastAt = beforeCursor.lastIndexOf('@');

        if (lastAt !== -1 && (lastAt === 0 || beforeCursor[lastAt - 1] === ' ' || beforeCursor[lastAt - 1] === '\n')) {
            const query = beforeCursor.slice(lastAt + 1);
            if (!query.includes(' ')) {
                const filtered = allUsers.filter(u =>
                    u.nombre.toLowerCase().includes(query.toLowerCase()) ||
                    (u.username && u.username.toLowerCase().includes(query.toLowerCase()))
                );
                setSuggestions(filtered.slice(0, 5));
                setShowSuggestions(true);
                return;
            }
        }

        setShowSuggestions(false);
    };

    const selectSuggestion = (user, text, setText) => {
        const beforeCursor = text.slice(0, cursorPosition);
        const afterCursor = text.slice(cursorPosition);
        const lastAt = beforeCursor.lastIndexOf('@');

        const newText = beforeCursor.slice(0, lastAt) + `@${user.username || user.nombre.replace(/\s/g, '_')} ` + afterCursor;
        setText(newText);
        setShowSuggestions(false);

        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    return {
        suggestions,
        showSuggestions,
        handleTextChange,
        selectSuggestion,
        loadUsers,
        textareaRef
    };
}
