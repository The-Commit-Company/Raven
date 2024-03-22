import { Sidebar } from "@/components/layout/Settings/SettingsSidebar"
import { Flex, Box } from "@radix-ui/themes"
import { Outlet } from "react-router-dom"

export interface Props { }

export const Settings = (props: Props) => {
    return (
        <>
            <Flex>
                <Box className={`w-64 bg-gray-2 border-r-gray-3 border-r dark:bg-gray-1`} left="0" top='0' position="fixed">
                    <Sidebar />
                </Box>
                <Box className='ml-[var(--sidebar-width)] w-[calc(100vw-var(--sidebar-width))] dark:bg-gray-2'>
                    <Outlet />
                </Box>
            </Flex>
        </>
    )
}