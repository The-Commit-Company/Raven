import { PropsWithChildren } from 'react'
import { Box, Flex } from '@radix-ui/themes'

export const PinnedMessagesHeader = ({ children }: PropsWithChildren) => {
    return (
        <header className='dark:bg-gray-2 bg-white fixed top-0' style={{
            // For testing
            zIndex: 900
        }}>
            <Box
                py='3'
                className='border-gray-4 sm:dark:border-gray-6 border-b w-[100vw] pl-4 pr-2 sm:px-0 sm:mx-4 sm:w-[calc(100vw-var(--sidebar-width)-var(--space-6))]'
            >
                <Flex justify='between'>
                    {children}
                </Flex>
            </Box>
        </header>
    )
}