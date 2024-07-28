import { Message } from '../../../../../../types/Messaging/Message'
import { DeleteMessageDialog, useDeleteMessage } from '../ChatMessage/MessageActions/DeleteMessage'
import { EditMessageDialog, useEditMessage } from '../ChatMessage/MessageActions/EditMessage'
import { MessageItem } from '../ChatMessage/MessageItem'
import { ChannelHistoryFirstMessage } from '@/components/layout/EmptyState'
import { useParams } from 'react-router-dom'
import useChatStream from './useChatStream'
import { useRef } from 'react'
import { Loader } from '@/components/common/Loader'
import ChatStreamLoader from './ChatStreamLoader'
import clsx from 'clsx'
import { DateSeparator } from '@/components/layout/Divider/DateSeparator'
import { useInView } from 'react-intersection-observer'
import { Button } from '@radix-ui/themes'
import { FiArrowDown } from 'react-icons/fi'
import { ErrorBanner } from '@/components/layout/AlertBanner'
import { ForwardMessageDialog, useForwardMessage } from '../ChatMessage/MessageActions/ForwardMessage'

/**
 * Anatomy of a message
 *
 * A message "stream" is a list of messages separated by dates
 *
 * A date block is a simple divider with a date. Any message below the divider was sent on this date.
 * Two date blocks can never be adjacent to each other.
 *
 * A message block can be of multiple types depending on the message type + who sent it and when.
 *
 * If two messages are sent by the same person within 2 minutes of each other, they are grouped together.
 * The first message in such a group will have a User Avatar, Name and timestamp, and the rest will not.
 * Subsequent message blocks in this 'mini-block' will only show a timestamp on hover.
 *
 * The message block can be of the following types:
 * 1. Image - this will show a preview of the image. Clicking on it will open the image in a modal.
 * 2. File - this will show a small box with the file name with actions to copy the link or download the file.
 *      PDF - PDF files will also have an action to open the file in a modal.
 *      Video - A video file will have a preview of the video.
 * 3. Text - this will show the text message in a tiptap renderer. A text block can have multiple elements
 *     1. Text - this will show the text as is (p, h1, h2, h3, h4, h5, h6, blockquote, li, ul, ol)
 *     2. Code - this will show in a container with a quick action button to copy it
 *     3. Mention - this will show the mentioned user's name (highlighted) and hovering over them should show a card with their details
 *
 * A message can also be a reply to another message. In this case, the message will have a small box at the top with the message content and a click will jump to the message.
 *
 * Every message has reactions at the very bottom. Every reaction has a count and a list of users who reacted to it.
 *
 * Every message will have a context menu (right click) with the following options:
 * 1. Reply - this will open the reply box with the message quoted
 * 2. Edit - this will open the edit box with the message content
 * 3. Delete - this will delete the message
 * 4. Copy - this will copy the message content
 * 5. Copy Link - this will copy the message link (if file)
 * 6. Send in an email
 * 7. Link with document
 * 8. Bookmark
 * 9. Pin - This will pin the message and add it to the pinned messages
 *
 * Every message will have a hover menu with the following options:
 * 1. Reaction emojis with the frequently used emojis for that user on this channel
 * 2. Reply/Edit depending on the user
 * 3. Ellipsis to open the context menu
 *
 */

type Props = {
    replyToMessage: (message: Message) => void,
}

const ChatStream = ({ replyToMessage }: Props) => {

    const { channelID } = useParams()

    const scrollRef = useRef<HTMLDivElement | null>(null)

    const { messages, hasOlderMessages, loadOlderMessages, goToLatestMessages, hasNewMessages, error, loadNewerMessages, isLoading, highlightedMessage, scrollToMessage } = useChatStream(scrollRef)
    const { setDeleteMessage, ...deleteProps } = useDeleteMessage()

    const { setEditMessage, ...editProps } = useEditMessage()
    const { setForwardMessage, ...forwardProps } = useForwardMessage()

    const onReplyMessageClick = (messageID: string) => {
        scrollToMessage(messageID)
    }

    const { ref: oldLoaderRef } = useInView({
        fallbackInView: true,
        initialInView: false,
        skip: !hasOlderMessages,
        onChange: (async (inView) => {
            if (inView && hasOlderMessages) {
                const lastMessage = messages ? messages[0] : null;
                await loadOlderMessages()
                // Restore the scroll position to the last message before loading more
                if (lastMessage?.message_type === 'date') {
                    document.getElementById(`date-${lastMessage?.creation}`)?.scrollIntoView()
                } else {
                    document.getElementById(`message-${lastMessage?.name}`)?.scrollIntoView()
                }

            }
        })
    });

    const { ref: newLoaderRef } = useInView({
        fallbackInView: true,
        skip: !hasNewMessages,
        initialInView: false,
        onChange: (inView) => {
            if (inView && hasNewMessages) {
                loadNewerMessages()
            }
        }
    });

    return (
        <div className='relative h-full flex flex-col overflow-y-auto pb-16 sm:pb-0' ref={scrollRef}>
            <div ref={oldLoaderRef}>
                {hasOlderMessages && !isLoading && <div className='flex w-full min-h-8 pb-4 justify-center items-center'>
                    <Loader />
                </div>}
            </div>
            {!isLoading && !hasOlderMessages && <ChannelHistoryFirstMessage channelID={channelID ?? ''} />}
            {isLoading && <ChatStreamLoader />}
            {error && <ErrorBanner error={error} />}
            <div className={clsx('flex flex-col pb-4 z-50 transition-opacity duration-400 ease-ease-out-cubic', isLoading ? 'opacity-0' : 'opacity-100')}>
                {messages?.map(message => {
                    if (message.message_type === 'date') {
                        return <DateSeparator key={`date-${message.creation}`} id={`date-${message.creation}`} className='p-2 z-10 relative'>
                            {message.creation}
                        </DateSeparator>
                    } else {
                        return <div key={`${message.name}_${message.modified}`} id={`message-${message.name}`}>
                            <div className="w-full overflow-x-clip overflow-y-visible text-ellipsis animate-fadein">
                                <MessageItem
                                    message={message}
                                    isHighlighted={highlightedMessage === message.name}
                                    onReplyMessageClick={onReplyMessageClick}
                                    setEditMessage={setEditMessage}
                                    replyToMessage={replyToMessage}
                                    forwardMessage={setForwardMessage}
                                    setDeleteMessage={setDeleteMessage} />
                            </div>
                        </div>
                    }
                }
                )}
            </div>
            {hasNewMessages && <div ref={newLoaderRef}>
                <div className='flex w-full min-h-8 pb-4 justify-center items-center'>
                    <Loader />
                </div>
            </div>}

            {hasNewMessages && <div className='fixed bottom-36 z-50 right-5'>
                <Button
                    className='shadow-lg'
                    onClick={goToLatestMessages}>
                    Scroll to new messages
                    <FiArrowDown size={18} />
                </Button>
            </div>}
            <DeleteMessageDialog {...deleteProps} />
            <EditMessageDialog {...editProps} />
            <ForwardMessageDialog {...forwardProps} />
        </div>

    )
}

export default ChatStream