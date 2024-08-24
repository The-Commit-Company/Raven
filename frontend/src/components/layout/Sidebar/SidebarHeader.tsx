import { commandMenuOpenAtom } from '@/components/feature/CommandMenu/CommandMenu'
import { Flex, IconButton, Text } from '@radix-ui/themes'
import { BiCommand } from 'react-icons/bi'
import { useSetAtom } from 'jotai'

export const SidebarHeader = () => {
    return (
        <header>
            <Flex
                justify='between'
                px='3'
                align='center'
                pt='1'
                height='48px'>
                <Text as='span' size='6' className='cal-sans pl-1'>raven</Text>
                <Flex align='center' gap='4' className='pr-1 sm:pr-0'>
                    <SearchButton />
                </Flex>
            </Flex>
        </header>
    )
}

const SearchButton = () => {

    const setOpen = useSetAtom(commandMenuOpenAtom)

    return (
        <IconButton
            size={{ initial: '2', md: '1' }}
            aria-label='Open command menu'
            title='Open command menu'
            color='gray'
            className='text-gray-11 sm:hover:text-gray-12 sm:hidden'
            variant='ghost'
            onClick={() => setOpen(true)}
        >
            <BiCommand className='text-lg' />
        </IconButton>
    )
}