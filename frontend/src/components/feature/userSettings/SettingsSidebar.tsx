import { useIsDesktop } from '@/hooks/useMediaQuery'
import { Box, Flex, Separator, Text } from '@radix-ui/themes'
import clsx from 'clsx'
import { PropsWithChildren, createElement } from 'react'
import { IconType } from 'react-icons'
import { BiBuildings } from 'react-icons/bi'
import { BsBoxes } from 'react-icons/bs'
import { LuUserCircle2 } from 'react-icons/lu'
import { NavLink } from 'react-router-dom'

export const SettingsSidebar = () => {

    const isDesktop = useIsDesktop()

    return (
        <Box className="h-[full] w-64 border-r border-gray-4  dark:border-gray-6">
            <Flex direction="column" gap='2' className='px-4'>
                <SettingsGroup title="My Account" icon={LuUserCircle2}>
                    <SettingsSidebarItem title="Profile" to='profile' />
                    <SettingsSidebarItem title="Appearance" to='appearance' />
                    {/* <SettingsSidebarItem title="Preferences" to='preferences' /> */}
                </SettingsGroup>
                <SettingsSeparator />
                <SettingsGroup title="Workspace" icon={BiBuildings}>
                    <SettingsSidebarItem title="Users" to='users' />
                    {/* <SettingsSidebarItem title="Bots" to='bots' /> */}
                </SettingsGroup>
                <SettingsSeparator />
                <SettingsGroup title='Integrations' icon={BsBoxes}>
                    {/* <SettingsSidebarItem title="ERPNext" to='erpnext' /> */}
                    <SettingsSidebarItem title="Frappe HR" to='frappe-hr' />
                    {/* <SettingsSidebarItem title="Frappe LMS" to='frappe-lms' /> */}
                    {/* <SettingsSidebarItem title="Frappe CRM" to='frappe-crm' /> */}
                </SettingsGroup>
            </Flex>
        </Box>
    )
}

const SettingsGroup = ({ title, icon, children }: PropsWithChildren<{ title: string, icon: IconType }>) => {
    return <Flex direction="column" className='gap-0.5'>
        <SettingsSidebarGroupHeader title={title} icon={icon} />
        {children}
    </Flex>
}

const SettingsSeparator = () => {
    return <Separator className={'w-full'} />
}
const SettingsSidebarGroupHeader = ({ title, icon }: { title: string, icon: IconType }) => {
    return (
        <Flex className="py-1.5 flex items-center gap-1.5 text-gray-11">
            {createElement(icon, { size: 15 })}
            <Text size='1'>{title}</Text>
        </Flex>
    )
}

const SettingsSidebarItem = ({ title, to, end }: { title: string, to: string, end?: boolean }) => {

    const activeClass = "bg-slate-3 dark:bg-slate-4 hover:bg-slate-3 hover:dark:bg-slate-4"

    return (
        <NavLink
            to={to}
            end={end}
            className='no-underline'
        >
            {({ isActive }) => {
                return (
                    <Box className='ml-4'>
                        <Flex className={clsx(`px-2 py-1 text-gray-12 rounded-md cursor-default w-full`, isActive ? activeClass : "bg-transparent hover:bg-slate-2 hover:dark:bg-slate-3")}>
                            <Text className='text-[13px]' weight='medium'>{title}</Text>
                        </Flex>
                    </Box>
                )
            }}
        </NavLink>
    )
}