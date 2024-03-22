import { useContext, useState } from 'react'
import { UserContext } from '../../../utils/auth/UserProvider'
import { useUserData } from '@/hooks/useUserData'
import { AddRavenUsers } from '@/components/feature/raven-users/AddRavenUsers'
import { DropdownMenu, Flex, IconButton, Link, Separator, Text } from '@radix-ui/themes'
import { BiDotsHorizontalRounded } from 'react-icons/bi'
import { UserAvatar } from '@/components/common/UserAvatar'
import { isSystemManager } from '@/utils/roles'

export const SidebarFooter = ({ isSettingsPage = false }: { isSettingsPage?: boolean }) => {

    const userData = useUserData()
    const { logout } = useContext(UserContext)

    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)

    const canAddUsers = isSystemManager()

    return (
        <Flex
            gap='1'
            direction='column'
            px='4'
            pb='4'
            bottom='0'
            position='fixed'
            className={`w-[var(--sidebar-width)] bg-gray-2 border-r-gray-3 border-r dark:bg-gray-1`} >
            <Flex direction='column' gap='2'>
                <Separator size='4' className={`bg-gray-4 dark:bg-gray-6`} />
                <Flex justify="between" align='center' px='1'>
                    <Flex gap='2' align='center'>
                        <UserAvatar src={userData.user_image} alt={userData.full_name} isActive />
                        <Text size="2">{userData.full_name}</Text>
                    </Flex>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <IconButton aria-label='Options' color='gray' variant='ghost'>
                                <BiDotsHorizontalRounded />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content variant='soft'>
                            {canAddUsers &&
                                <DropdownMenu.Item color='gray' onClick={() => setIsAddUserModalOpen(true)} className="cursor-pointer">
                                    Add users to Raven
                                </DropdownMenu.Item>
                            }
                            {canAddUsers &&
                                <DropdownMenu.Separator />
                            }
                            <DropdownMenu.Item color='gray' className='group'>
                                <Link href="/app" className='no-underline'>
                                    Desk Interface
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item color='gray' className='group'>
                                <Link href="/raven_mobile" className='no-underline'>
                                    Mobile App
                                </Link>
                            </DropdownMenu.Item>
                            {!isSettingsPage && <DropdownMenu.Item color='gray' className='group'>
                                <Link href="../settings" className='no-underline'>
                                    Settings
                                </Link>
                            </DropdownMenu.Item>}
                            <DropdownMenu.Item onClick={logout} color='red' className='cursor-pointer'>
                                Log Out
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Flex>
            </Flex>
            <AddRavenUsers isOpen={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} />
        </Flex>
    )
}