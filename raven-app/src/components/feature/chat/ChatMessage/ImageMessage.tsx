import { getFileName } from '@/utils/operations'
import { ImageMessage } from '../../../../../../types/Messaging/Message'
import { Box, Button, Dialog, Flex, Link } from '@radix-ui/themes'
import { useState } from 'react'
import { DIALOG_CONTENT_CLASS } from '@/utils/layout/dialog'
import { BiDownload } from 'react-icons/bi'
import { UserFields } from '@/utils/users/UserListProvider'
import { DateMonthAtHourMinuteAmPm } from '@/utils/dateConversions'

interface ImageMessageProps {
    message: ImageMessage,
    user?: UserFields,
}

export const ImageMessageBlock = ({ message, user }: ImageMessageProps) => {

    const [isOpen, setIsOpen] = useState(false)
    // Show skeleton loader when image is loading

    const height = message.thumbnail_height ?? '200'
    const width = message.thumbnail_width ?? '300'

    const fileName = getFileName(message.file)
    return (
        <Flex direction='column' gap='1'>
            <Link
                href={message.file}
                size='1'
                color='gray'
                target='_blank'>{fileName}</Link>
            <Box
                className='relative rounded-md cursor-pointer'
                role='button'
                onClick={() => setIsOpen(true)}
                style={{
                    height: height + 'px',
                    width: width + 'px',
                }}>

                {/* Absolute positioned skeleton loader */}
                <Box className=' absolute top-0 z-0 left-0' style={{
                    height: height + 'px',
                    width: width + 'px',
                }}>
                    <Box style={{
                        height: height + 'px',
                        width: width + 'px',
                    }} className='bg-[var(--gray-3)] z-0 dark:bg-[var(--gray-5)] rounded-md'>

                    </Box>
                </Box>
                <img
                    src={message.file}
                    loading='lazy'
                    className='z-50 absolute top-0 left-0 rounded-md shadow-md object-cover'
                    height={height}
                    width={width}
                    alt={`Image file sent by ${message.owner} at ${message.creation}`}
                />
            </Box>
            <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
                <Dialog.Content className={DIALOG_CONTENT_CLASS}>
                    <Dialog.Title size='3'>{fileName}</Dialog.Title>
                    <Dialog.Description color='gray' size='1'>{user?.full_name ?? message.owner} on <DateMonthAtHourMinuteAmPm date={message.creation} /></Dialog.Description>
                    <Box my='4'>
                        <img
                            src={message.file}
                            loading='lazy'
                            className='rounded-md shadow-md'
                            alt={`Image file sent by ${message.owner} at ${message.creation}`}
                        />
                    </Box>
                    <Flex justify='end' gap='2' mt='3'>
                        <Button variant='soft' color='gray' asChild>
                            <Link className='no-underline' href={message.file} download>
                                <BiDownload />
                                Download
                            </Link>
                        </Button>
                        <Dialog.Close>
                            <Button color='gray' variant='soft'>Close</Button>
                        </Dialog.Close>
                    </Flex>

                </Dialog.Content>
            </Dialog.Root>
        </Flex>
    )
}