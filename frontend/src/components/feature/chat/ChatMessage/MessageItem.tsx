import { Avatar, Badge, Box, ContextMenu, Flex, HoverCard, Link, Separator, Text, Theme } from '@radix-ui/themes'
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
import { PollMessageBlock } from './Renderers/PollMessage'
import { TiptapRenderer } from './Renderers/TiptapRenderer/TiptapRenderer'
import { QuickActions } from './MessageActions/QuickActions/QuickActions'
import { memo, useMemo, useState } from 'react'
import { ReplyMessageBox } from './ReplyMessageBox/ReplyMessageBox'
import { generateAvatarColor } from '../../selectDropdowns/GenerateAvatarColor'
import { DoctypeLinkRenderer } from './Renderers/DoctypeLinkRenderer'
import { useDebounce } from '@/hooks/useDebounce'
import { RiRobot2Fill, RiShareForwardFill } from 'react-icons/ri'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useDoubleTap } from 'use-double-tap'
import useOutsideClick from '@/hooks/useOutsideClick'
import { getStatusText } from '../../userSettings/AvailabilityStatus/SetUserAvailabilityMenu'

interface MessageBlockProps {
    message: Message,
    setDeleteMessage: (message: Message) => void,
    setEditMessage: (message: Message) => void,
    replyToMessage: (message: Message) => void,
    pinMessage: (message: Message) => void,
    forwardMessage: (message: Message) => void,
    onReplyMessageClick: (messageID: string) => void,
    isHighlighted?: boolean
}

export const MessageItem = ({ message, setDeleteMessage, isHighlighted, onReplyMessageClick, setEditMessage, replyToMessage, pinMessage, forwardMessage }: MessageBlockProps) => {

    const { name, owner: userID, is_bot_message, bot, creation: timestamp, message_reactions, is_continuation, linked_message, replied_message_details } = message

    const { user, isActive } = useGetUserDetails(is_bot_message && bot ? bot : userID)

    const onDelete = () => {
        setDeleteMessage(message)
    }

    const onEdit = () => {
        setEditMessage(message)
    }

    const onReply = () => {
        replyToMessage(message)
    }

    const onPin = () => {
        pinMessage(message);
    }

    const onForward = () => {
        forwardMessage(message)
    }

    const isDesktop = useIsDesktop()

    const [isHovered, setIsHovered] = useState(false)
    const isHoveredDebounced = useDebounce(isHovered, isDesktop ? 400 : 200)

    const onMouseEnter = () => {
        if (isDesktop) {
            setIsHovered(true)
        }
    }

    const onMouseLeave = () => {
        if (isDesktop) {
            setIsHovered(false)
        }
    }

    // For mobile, we want to show the quick actions on double tap
    const bind = useDoubleTap((event) => {
        if (!isDesktop)
            setIsHovered(!isHovered)
    });

    const ref = useOutsideClick(() => {
        if (!isDesktop)
            setIsHovered(false)
    });

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
                    {...bind}
                    ref={ref}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    className={clsx(`group
                            sm:hover:bg-gray-2
                            active:bg-gray-2
                            sm:hover:transition-all
                            active:hover:transition-all
                            sm:hover:delay-100
                            active:hover:delay-100
                            select-none
                            sm:select-auto
                            sm:dark:hover:bg-gray-3
                            dark:active:bg-gray-4
                            data-[state=open]:bg-accent-2
                            dark:data-[state=open]:bg-gray-4
                            data-[state=open]:shadow-sm
                            transition-colors
                            px-1
                            py-2
                            sm:p-2
                            rounded-md`, isHighlighted ? 'bg-yellow-50 hover:bg-yellow-50 dark:bg-yellow-300/20 dark:hover:bg-yellow-300/20' : !isDesktop && isHovered ? 'bg-gray-2 dark:bg-gray-3' : '')}>
                    <Flex className='gap-2.5 sm:gap-3 items-start'>
                        <MessageLeftElement message={message} user={user} isActive={isActive} />
                        <Flex direction='column' className='gap-0.5' justify='center' width='100%'>
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
                            {message.is_forwarded === 1 && <Flex className='text-gray-10 text-xs' gap={'1'} align={'center'}><RiShareForwardFill size='12' /> forwarded</Flex>}
                            {/* If it's a reply, then show the linked message */}
                            {linked_message && replied_message_details && <ReplyMessageBox
                                className='sm:min-w-[32rem] cursor-pointer mb-1'
                                role='button'
                                onClick={() => onReplyMessageClick(linked_message)}
                                message={replyMessageDetails} />
                            }
                            { /* Show message according to type */}
                            <MessageContent
                                message={message}
                                user={user}
                            />

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
                                onForward={onForward}
                            />
                        }
                    </Flex>

                </ContextMenu.Trigger>

                <MessageContextMenu
                    message={message}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReply={onReply}
                    onForward={onForward}
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
    return <Box className={clsx(message.is_continuation ? 'invisible group-hover:visible flex items-center w-[38px] sm:w-[34px]' : '', className)} {...props}>
        {message.is_continuation ?
            <Box className='-mt-0.5'>
                <DateTooltipShort timestamp={message.creation} />
            </Box>

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
    const isBot = user?.type === 'Bot'
    const color = useMemo(() => generateAvatarColor(user?.full_name ?? userID), [user?.full_name, userID])
    const availabilityStatus = user?.availability_status

    return <Theme accentColor={color}><span className="relative inline-block">
        <Avatar src={user?.user_image} alt={user?.full_name ?? userID} loading='lazy' fallback={getInitials(alt)} size={'2'} radius={'medium'} />

        {availabilityStatus && availabilityStatus === 'Away' &&
            <span className={clsx("absolute block translate-x-1/2 translate-y-1/2 transform rounded-full", 'bottom-0.5 right-0.5')}>
                <span className="block h-2 w-2 rounded-full border border-slate-2 bg-[#FFAA33] shadow-md" />
            </span>
        }

        {availabilityStatus && availabilityStatus === 'Do not disturb' &&
            <span className={clsx("absolute block translate-x-1/2 translate-y-1/2 transform rounded-full", 'bottom-0.5 right-0.5')}>
                <span className="block h-2 w-2 rounded-full border border-slate-2 bg-[#D22B2B] shadow-md" />
            </span>
        }

        {availabilityStatus !== 'Away' && availabilityStatus !== 'Do not disturb' && isActive &&
            <span className={clsx("absolute block translate-x-1/2 translate-y-1/2 transform rounded-full", 'bottom-0.5 right-0.5')}>
                <span className="block h-2 w-2 rounded-full border border-slate-2 bg-green-600 shadow-md" />
            </span>
        }

        {isBot && <span className="absolute block translate-x-1/2 translate-y-1/2 transform rounded-full bottom-0.5 right-0.5">
            <RiRobot2Fill className="text-accent-11 dark:text-accent-11" size="1rem" />
        </span>}
    </span>
    </Theme>
})

export const UserHoverCard = memo(({ user, userID, isActive }: UserProps) => {

    const { isBot, fullName, userImage, availabilityStatus, customStatus } = useMemo(() => {
        return {
            fullName: user?.full_name ?? userID,
            availabilityStatus: user?.availability_status,
            customStatus: user?.custom_status,
            userImage: user?.user_image ?? '',
            isBot: user?.type === 'Bot'
        }
    }, [user, userID])
    return <HoverCard.Root>
        <HoverCard.Trigger>
            <Link className='text-gray-12 flex items-center gap-1' weight='medium' size='2'>
                {fullName} {isBot && <Badge color='gray' className='font-semibold px-1 py-0'>Bot</Badge>}
            </Link>
        </HoverCard.Trigger>
        <HoverCard.Content size='1'>
            <Flex gap='2' align='center'>
                <UserAvatar src={userImage} alt={fullName} size='4' isBot={isBot} />
                <Flex direction='column'>
                    <Flex gap='3' align='center'>
                        <Text className='text-gray-12' weight='bold' size='3'>{fullName}</Text>
                        {/* if availabilityStatus is set to 'Invisible', don't show the status */}
                        {availabilityStatus && availabilityStatus !== 'Invisible' && <Flex className='text-gray-10 text-xs flex gap-1 items-center'>
                            {getStatusText(availabilityStatus)}
                        </Flex>}
                        {/* only show user active status if the user has not explicitly set their availability status */}
                        {!availabilityStatus && isActive && <Flex gap='1' align='center'>
                            <BsFillCircleFill color={'green'} size='8' />
                            <Text className='text-gray-10' size='1'>Online</Text>
                        </Flex>}
                    </Flex>
                    {customStatus ? <Text className='text-gray-11' size='1'>{customStatus}</Text> : user && !isBot && <Text className='text-gray-11' size='1'>{user?.name}</Text>}
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
        }} user={user} showLinkPreview={message.hide_link_preview ? false : true} /> : null}
        {message.message_type === 'Image' && <ImageMessageBlock message={message} user={user} />}
        {message.message_type === 'File' && <FileMessageBlock message={message} user={user} />}
        {message.message_type === 'Poll' && <PollMessageBlock message={message} user={user} />}
    </Box>
}