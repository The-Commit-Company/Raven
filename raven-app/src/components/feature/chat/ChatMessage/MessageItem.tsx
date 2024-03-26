import { Avatar, Box, ContextMenu, Flex, HoverCard, Link, Separator, Text } from '@radix-ui/themes'
import { Message, MessageBlock } from '../../../../../../types/Messaging/Message'
import { MessageContextMenu } from './MessageActions/MessageActions'
import { DateTooltip, DateTooltipShort } from './Renderers/DateTooltip'
import { BoxProps } from '@radix-ui/themes/dist/cjs/components/box'
import { clsx } from 'clsx'
import { UserAvatar, getInitials } from '@/components/common/UserAvatar'
import { useGetUser } from '@/hooks/useGetUser'
import { useIsUserActive } from '@/hooks/useIsUserActive'
import { UserFields } from '@/utils/users/UserListProvider'
import { BsFillCircleFill } from 'react-icons/bs'
import { MessageReactions } from './MessageReactions'
import { ImageMessageBlock } from './Renderers/ImageMessage'
import { FileMessageBlock } from './Renderers/FileMessage'
import { TiptapRenderer } from './Renderers/TiptapRenderer/TiptapRenderer'
import { QuickActions } from './MessageActions/QuickActions/QuickActions'
import { memo, useMemo, useState } from 'react'
import { ReplyMessageBox } from './ReplyMessageBox/ReplyMessageBox'
import { generateAvatarColor } from '../../select-member/GenerateAvatarColor'
import { DoctypeLinkRenderer } from './Renderers/DoctypeLinkRenderer'
import { useDebounce } from '@/hooks/useDebounce'

interface MessageBlockProps {
    message: Message,
    setDeleteMessage: (message: Message) => void,
    setEditMessage: (message: Message) => void,
    replyToMessage: (message: Message) => void,
    onReplyMessageClick: (messageID: string) => void,
    isHighlighted?: boolean
}

export const MessageItem = ({ message, setDeleteMessage, isHighlighted, onReplyMessageClick, setEditMessage, replyToMessage }: MessageBlockProps) => {

    const { name, owner: userID, creation: timestamp, message_reactions, is_continuation, linked_message, replied_message_details } = message

    const { user, isActive } = useGetUserDetails(userID)

    const onDelete = () => {
        setDeleteMessage(message)
    }

    const onEdit = () => {
        setEditMessage(message)
    }

    const onReply = () => {
        replyToMessage(message)
    }

    const [isHovered, setIsHovered] = useState(false)
    const isHoveredDebounced = useDebounce(isHovered, 400)

    const onMouseEnter = () => {
        setIsHovered(true)
    }

    const onMouseLeave = () => {
        setIsHovered(false)

    }

    const replyMessageDetails = useMemo(() => {
        if (typeof replied_message_details === 'string') {
            return JSON.parse(replied_message_details)
        } else {
            return replied_message_details
        }
    }, [replied_message_details])

    return (
        <Box className='relative'>
            <ContextMenu.Root>
                <ContextMenu.Trigger
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    // disabled={!isHoveredDebounced}
                    className={clsx(`group
                            hover:bg-gray-100
                            hover:transition-all
                            hover:delay-100
                            dark:hover:bg-gray-3
                            data-[state=open]:bg-accent-2
                            dark:data-[state=open]:bg-gray-4
                            data-[state=open]:shadow-sm
                            transition-colors
                            p-2
                            rounded-md`, isHighlighted ? 'bg-yellow-50 hover:bg-yellow-50 dark:bg-yellow-300/20 dark:hover:bg-yellow-300/20' : '')}>
                    <Flex gap='3' >
                        <MessageLeftElement message={message} user={user} isActive={isActive} />
                        <Flex direction='column' className='gap-0.5' justify='center'>
                            {!is_continuation ? <Flex align='center' gap='2' mt='-1'>
                                <UserHoverCard
                                    user={user}
                                    userID={userID}
                                    isActive={isActive} />
                                <Separator orientation='vertical' />
                                <DateTooltip timestamp={timestamp} />
                            </Flex>
                                : null}
                            {/* Message content goes here */}
                            {/* If it's a reply, then show the linked message */}
                            {linked_message && replied_message_details && <ReplyMessageBox
                                className='min-w-[32rem] cursor-pointer mb-1'
                                role='button'
                                onClick={() => onReplyMessageClick(linked_message)}
                                message={replyMessageDetails} />
                            }
                            { /* Show message according to type */}
                            <MessageContent
                                message={message}
                                user={user}
                                className={clsx(message.is_continuation ? 'ml-0.5' : '')} />

                            {message.link_doctype && message.link_document && <Box className={clsx(message.is_continuation ? 'ml-0.5' : '-ml-0.5')}>
                                <DoctypeLinkRenderer doctype={message.link_doctype} docname={message.link_document} />
                            </Box>}
                            {message.is_edited === 1 && <Text size='1' className='text-gray-10'>(edited)</Text>}
                            {message_reactions?.length &&
                                <MessageReactions
                                    messageID={name}
                                    message_reactions={message_reactions}
                                />
                            }
                        </Flex>
                        {isHoveredDebounced &&
                            <QuickActions
                                message={message}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onReply={onReply}
                            />
                        }
                    </Flex>

                </ContextMenu.Trigger>

                <MessageContextMenu
                    message={message}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReply={onReply}
                />
            </ContextMenu.Root>
        </Box >
    )
}

interface MessageLeftElementProps extends BoxProps {
    message: MessageBlock['data'],
    user?: UserFields,
    isActive?: boolean
}
const MessageLeftElement = ({ message, className, user, isActive, ...props }: MessageLeftElementProps) => {

    // If it's a continuation, then show the timestamp

    // Else, show the avatar
    return <Box className={clsx(message.is_continuation ? 'invisible group-hover:visible flex items-center max-w-[32px] w-[32px]' : '', className)} {...props}>
        {message.is_continuation ?
            <DateTooltipShort timestamp={message.creation} />
            : <MessageSenderAvatar userID={message.owner} user={user} isActive={isActive} />
        }
    </Box>

}

export const useGetUserDetails = (userID: string) => {

    const user = useGetUser(userID)

    const isActive = useIsUserActive(userID)

    return { user, isActive }
}

interface UserProps {
    user?: UserFields
    userID: string,
    isActive?: boolean
}
export const MessageSenderAvatar = memo(({ user, userID, isActive = false }: UserProps) => {

    const alt = user?.full_name ?? userID
    return <span className="relative inline-block">
        <Avatar color={generateAvatarColor(user?.full_name ?? userID)} src={user?.user_image} alt={user?.full_name ?? userID} loading='lazy' fallback={getInitials(alt)} size={'2'} radius={'medium'} />
        {isActive &&
            <span className={clsx("absolute block translate-x-1/2 translate-y-1/2 transform rounded-full", 'bottom-0.5 right-0.5')}>
                <span className="block h-2 w-2 rounded-full border border-slate-2 bg-green-600 shadow-md" />
            </span>
        }
    </span>
})

export const UserHoverCard = memo(({ user, userID, isActive }: UserProps) => {

    return <HoverCard.Root>
        <HoverCard.Trigger>
            <Link className='text-gray-12' weight='medium' size='2'>
                {user?.full_name ?? userID}
            </Link>
        </HoverCard.Trigger>
        <HoverCard.Content size='1'>
            <Flex gap='2' align='center'>
                <UserAvatar src={user?.user_image} alt={user?.full_name ?? userID} size='4' />
                <Flex direction='column'>
                    <Flex gap='3' align='center'>
                        <Text className='text-gray-12' weight='bold' size='3'>{user?.full_name ?? userID}</Text>
                        {isActive && <Flex gap='1' align='center'>
                            <BsFillCircleFill className='text-green-500' size='8' />
                            <Text className='text-gray-10' size='1'>Online</Text>
                        </Flex>}
                    </Flex>
                    {user && <Text className='text-gray-11' size='1'>{user?.name}</Text>}
                </Flex>
            </Flex>
        </HoverCard.Content>
    </HoverCard.Root>
})
interface MessageContentProps extends BoxProps {
    user?: UserFields
    message: Message,
}
export const MessageContent = ({ message, user, ...props }: MessageContentProps) => {

    return <Box {...props}>
        {message.text ? <TiptapRenderer message={{
            ...message,
            message_type: 'Text'
        }} user={user} /> : null}
        {message.message_type === 'Image' && <ImageMessageBlock message={message} user={user} />}
        {message.message_type === 'File' && <FileMessageBlock message={message} user={user} />}
    </Box>
}