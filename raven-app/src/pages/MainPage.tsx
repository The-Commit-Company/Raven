import { Flex, Box } from '@radix-ui/themes'
import { Outlet } from 'react-router-dom'
import { lazy } from 'react'
import { Sidebar } from '../components/layout/Sidebar/Sidebar'
import { VirtuosoRefProvider } from '../utils/message/VirtuosoRefProvider'
import { MobileAppRedirectBanner } from '@/components/layout/AlertBanner'
import '../components/layout/AlertBanner/styles.css'

const AddRavenUsersPage = lazy(() => import('@/pages/AddRavenUsersPage'))

export const MainPage = () => {

    return (
        <div>
            <div className='web-app'>
                <Flex>
                    <Box className={`w-64 bg-gray-2 border-r-gray-3 border-r dark:bg-gray-1`} left="0" top='0' position="fixed">
                        <Sidebar />
                    </Box>
                    <Box className='ml-[var(--sidebar-width)] w-[calc(100vw-var(--sidebar-width))] dark:bg-gray-2'>
                        <VirtuosoRefProvider>
                            <Outlet />
                        </VirtuosoRefProvider>
                    </Box>
                </Flex>
            </div>
            <div className='mobile-app-message'>
                <MobileAppRedirectBanner />
            </div>
        </div>

    )

}