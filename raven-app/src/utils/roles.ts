export const hasRavenUserRole = () => {
    if (import.meta.env.PROD) {
    //@ts-expect-error
    return (window?.frappe?.boot?.user?.roles ?? []).includes('Raven User');
    } else {
        return true
    }
}

export const isSystemManager = () => {
    //@ts-expect-error
    return (window?.frappe?.boot?.user?.roles ?? []).includes('System Manager');
}