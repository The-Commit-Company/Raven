/* eslint-disable react/jsx-no-useless-fragment */
import { Theme, ThemeProps } from '@radix-ui/themes';
import React from 'react';
import { PropsWithChildren, useEffect, useCallback, useState, useMemo } from 'react';
import { useStickyState } from '@/hooks/useStickyState';
import { toast } from 'sonner'

const MEDIA = '(prefers-color-scheme: dark)'

export type ThemeType = 'light' | 'dark' | 'system';
interface ThemeProviderProps extends ThemeProps {
    defaultTheme?: ThemeType
}

export const ThemeProvider: React.FC<PropsWithChildren<ThemeProviderProps>> = ({ children, defaultTheme = 'system' }) => {
    const [appearance, setAppearance] = useStickyState<ThemeType>(defaultTheme, 'app-theme');
    const [effectiveTheme, setEffectiveTheme] = useState<ThemeType>(appearance);

    const handleMediaQuery = useCallback((e: MediaQueryListEvent | MediaQueryList) => {
        const resolvedTheme = systemTheme();
        setEffectiveTheme(resolvedTheme);

        setThemeDataAttribute(resolvedTheme);
        setMetaThemeColor(resolvedTheme);

        toast.success(`Theme switched to ${appearance === 'system' ? `${appearance}(${resolvedTheme})` : appearance}`)
    }, [appearance])
    
    useEffect(() => {
        const media = window.matchMedia(MEDIA)
        media.addEventListener("change", handleMediaQuery)
        return () => media.removeEventListener("change", handleMediaQuery)
    }, [handleMediaQuery])

    useEffect(() => {
        setMetaThemeColor(appearance);
        setThemeDataAttribute(appearance);
    }, [appearance]);

    const handleThemeChange = (newTheme: ThemeType) => {
        setAppearance(newTheme);
        toast.success(`Theme switched to ${newTheme === 'system' ? `${newTheme}(${systemTheme()})` : newTheme}`)
    };

    return (
        <Theme appearance={appearance === 'system' ? effectiveTheme !== 'system' ? effectiveTheme : systemTheme() : appearance}>
            <ThemeContext.Provider value={{ appearance: appearance as ThemeType, changeTheme: handleThemeChange, systemTheme }}>
                {children}
            </ThemeContext.Provider>
        </Theme>
    );
};

interface ThemeContextType {
    appearance: ThemeType;
    changeTheme: (newTheme: ThemeType) => void;
    systemTheme: () => Omit<ThemeType, 'system'>;
}

export const ThemeContext = React.createContext<ThemeContextType>({
    appearance: 'system',
    changeTheme: () => {},
    systemTheme: () => 'light'
});

export const useTheme = () => React.useContext(ThemeContext);

const systemTheme = (e?: MediaQueryListEvent | MediaQueryList) => {
    if (!e) e = window.matchMedia(MEDIA);
    return e.matches ? 'dark' : 'light';
}

const setThemeDataAttribute = (appearance: ThemeType) => {
    if (appearance === 'system') {
        document.documentElement.setAttribute('data-theme', systemTheme());
        return;
    }
    document.documentElement.setAttribute('data-theme', appearance);
}

const setMetaThemeColor = (appearance: ThemeType) => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (appearance === 'system') if (document?.body) metaThemeColor?.setAttribute('content', systemTheme() === 'light' ? '#FFFFFF' : '#191919');
    if (appearance === 'light') if (document?.body) metaThemeColor?.setAttribute('content', '#FFFFFF');
    if (appearance === 'dark') if (document?.body) metaThemeColor?.setAttribute('content', '#191919');
}
