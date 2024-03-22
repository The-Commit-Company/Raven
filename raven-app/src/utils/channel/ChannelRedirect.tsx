import { Suspense, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { hasRavenUserRole } from '../roles'
import { FullPageLoader } from '@/components/layout/Loaders'
import AddRavenUsersPage from '@/pages/AddRavenUsersPage'
import { ActiveUsersProvider } from '../users/ActiveUsersProvider'
import { UserListProvider } from '../users/UserListProvider'
import { ChannelListProvider } from './ChannelListProvider'

/**
 * Redirects to the last channel visited by the user
 * If last channel is not found, redirects to general channel
 */
export const ChannelRedirect = () => {

    const lastChannel = localStorage.getItem('ravenLastChannel') ?? 'general'

    const navigate = useNavigate()
    const { pathname } = useLocation()

    const isRavenUser = hasRavenUserRole()

    useEffect(() => {
        if (isRavenUser && (pathname === '/channel' || pathname === '/')) navigate(`/channel/${lastChannel}`, {
            replace: true
        })
    }, [pathname, isRavenUser])

    if (isRavenUser) {
        return (
            <UserListProvider>
                <ChannelListProvider>
                    <ActiveUsersProvider>
                        <Outlet />
                    </ActiveUsersProvider>
                </ChannelListProvider>
            </UserListProvider>
        )

    }
    return <Suspense fallback={<FullPageLoader />}>
        <AddRavenUsersPage />
    </Suspense>
}