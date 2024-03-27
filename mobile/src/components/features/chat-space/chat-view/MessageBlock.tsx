import { useContext, useMemo } from 'react'
import { FileMessage, ImageMessage, Message, TextMessage } from '../../../../../../types/Messaging/Message'
import { IonIcon, IonSkeletonText, IonText } from '@ionic/react'
import { SquareAvatar } from '@/components/common/UserAvatar'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { UserFields } from '@/utils/users/UserListProvider'
import { DateObjectToFormattedDateStringWithoutYear, DateObjectToTimeString } from '@/utils/operations/operations'
import { ChannelMembersContext } from '../ChatInterface'
import { openOutline } from 'ionicons/icons'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { useIsUserActive } from '@/hooks/useIsUserActive'
import { useInView } from 'react-intersection-observer';
import useLongPress from '@/hooks/useLongPress'
import MessageReactions from './components/MessageReactions'
import parse from 'html-react-parser';
import clsx from 'clsx'

type Props = {
    message: Message,
    onMessageSelect: (message: Message) => void,
    isHighlighted?: boolean,
    onReplyMessageClick: (messageID: string) => void
}

export const MessageBlockItem = ({ message, onMessageSelect, isHighlighted = false, onReplyMessageClick }: Props) => {
    const members = useContext(ChannelMembersContext)
    /**
     * Displays a message block in the chat interface
     * A message can have the following properties:
     * 1. Is Continuation - if it is, no need to show Avatar and timestamp
     * 2. Is Reply - if it is, show the reply message above the message in the same box
     * 3. Message Type - Text, Image, File - will need to show the content accordingly
     */

    const user = members[message.owner]

    return (
        <div className='px-2 my-0 animate-fadein' id={`message-${message.name}`}>
            {message.is_continuation === 0 ? <NonContinuationMessageBlock
                message={message}
                isHighlighted={isHighlighted}
                onMessageSelect={onMessageSelect}
                onReplyMessageClick={onReplyMessageClick}
                user={user} /> :
                <ContinuationMessageBlock
                    message={message}
                    isHighlighted={isHighlighted}
                    onReplyMessageClick={onReplyMessageClick}
                    onMessageSelect={onMessageSelect} />}
        </div>
    )
}

interface NonContinuationMessageBlockProps {
    message: Message,
    user?: UserFields,
    onMessageSelect: (message: Message) => void,
    isHighlighted: boolean,
    onReplyMessageClick: (messageID: string) => void
}
export const NonContinuationMessageBlock = ({ message, user, onMessageSelect, isHighlighted, onReplyMessageClick }: NonContinuationMessageBlockProps) => {

    const onLongPress = () => {
        Haptics.impact({
            style: ImpactStyle.Medium
        })
        onMessageSelect(message)
    }

    const longPressEvent = useLongPress(onLongPress)
    return <div>
        {/* @ts-expect-error */}
        <div className={clsx('px-2 mt-3 py-1 rounded-md flex active:bg-[color:var(--ion-color-light)]',
            isHighlighted ? 'bg-yellow-300/20 dark:bg-yellow-300/20' : '')} {...longPressEvent}>
            <UserAvatarBlock message={message} user={user} />
            <div>
                <div className='flex items-baseline'>
                    <p className="text-foreground text-sm font-medium leading-normal tracking-normal">{user?.full_name ?? message.owner}</p>
                    <p className='text-xs pl-1.5 text-foreground/50'>{DateObjectToTimeString(message.creation)}</p>
                </div>
                <MessageContent message={message} onReplyMessageClick={onReplyMessageClick} />
                {message.is_edited === 1 && <IonText className='text-xs' color={'medium'}>(edited)</IonText>}
            </div>
        </div>
        <div className='pl-12 m-1'>
            <MessageReactions messageID={message.name} channelID={message.channel_id} message_reactions={message.message_reactions} />
        </div>

    </div>
}

export const UserAvatarBlock = ({ message, user }: { message: Message, user?: UserFields }) => {

    const isActive = useIsUserActive(user?.name ?? message.owner)
    return <div className='w-11 mt-0.5'>
        <SquareAvatar alt={user?.full_name ?? message.owner} src={user?.user_image} isActive={isActive} />
    </div>
}

interface ContinuationMessageBlockProps {
    message: Message,
    onMessageSelect: (message: Message) => void,
    isHighlighted: boolean
    onReplyMessageClick: (messageID: string) => void
}
const ContinuationMessageBlock = ({ message, onMessageSelect, isHighlighted, onReplyMessageClick }: ContinuationMessageBlockProps) => {
    const onLongPress = () => {
        Haptics.impact({
            style: ImpactStyle.Medium
        })
        onMessageSelect(message)
    }

    const longPressEvent = useLongPress(onLongPress)

    return <div>
        {/* @ts-expect-error */}
        <div className={clsx('px-2 py-0.5 flex rounded-md  active:bg-[color:var(--ion-color-light)]',
            isHighlighted ? 'bg-yellow-300/20 dark:bg-yellow-300/20' : '')} {...longPressEvent}>
            <div className='w-11'>
            </div>
            <div>
                <MessageContent message={message} onReplyMessageClick={onReplyMessageClick} />
                {message.is_edited === 1 && <IonText className='text-xs' color={'medium'}>(edited)</IonText>}
            </div>

        </div>

        <div className='pl-12 m-1'>
            <MessageReactions messageID={message.name} channelID={message.channel_id} message_reactions={message.message_reactions} />
        </div>
    </div>
}

const MessageContent = ({ message, onReplyMessageClick }: { message: Message, onReplyMessageClick: (messageID: string) => void }) => {
    const scrollToMessage = () => {
        if (message.linked_message) {
            Haptics.impact({
                style: ImpactStyle.Light
            })
            onReplyMessageClick(message.linked_message)
        }
    }
    return <div className='min-w-[100px] max-w-[320px]'>
        {message.is_reply === 1 && message.linked_message && message.replied_message_details &&
            <div role='button' onClick={scrollToMessage}>
                <ReplyBlock message={JSON.parse(message.replied_message_details)} />
            </div>
        }
        {message.message_type === 'Text' && <div className='text-foreground text-sm font-normal leading-normal tracking-normal'><TextMessageBlock message={message} /></div>}
        {message.message_type === 'Image' && <ImageMessageBlock message={message} />}
        {message.message_type === 'File' && <FileMessageBlock message={message} />}
    </div>
}

const TextMessageBlock = ({ message, truncate = false }: { message: TextMessage, truncate?: boolean }) => {


    return <div className={'py-0.5 rounded-lg' + (truncate ? ' line-clamp-3' : '')}>
        <MarkdownRenderer content={message.text} truncate={truncate} />
    </div>
}
const options = {
    root: null,
    rootMargin: "100px",
    threshold: 0.5,
    triggerOnce: true
};

const ImageMessageBlock = ({ message }: { message: ImageMessage }) => {
    const { ref, inView } = useInView(options);

    const height = `${message.thumbnail_height ?? 200}px`
    const width = `${message.thumbnail_width ?? 300}px`
    return <div className='py-1.5 rounded-lg' ref={ref} style={{
        minWidth: width,
        minHeight: height
    }}>
        {inView ?
            <img src={message.file}
                alt={`Image`}
                loading='lazy'
                className='rounded-md object-cover bg-transparent'
                style={{
                    width: width,
                    height: height,
                    maxWidth: '280px'
                }}
            />
            :
            <IonSkeletonText animated className='max-w-60 rounded-md' style={{
                width: width,
                height: height,
                maxWidth: '280px'
            }} />
        }
    </div>
}

const FileMessageBlock = ({ message }: { message: FileMessage }) => {

    return <div className='py-0.5 my-1 rounded-md bg-zinc-900'>
        <p className='p-2 text-sm text-zinc-300'>
            📎 &nbsp;{message.file?.split('/')[3]}
        </p>
        <div className='mt-2 text-center'>
            <a
                className='w-full py-2 flex 
                items-center 
                space-x-1.5 
                justify-center border-t-2
                rounded-b-md
                border-t-zinc-800
                text-blue-400
                text-sm
                active:bg-blue-500
                active:text-zinc-300'
                target='_blank'
                href={message.file}
            >
                <span>View File</span>
                <IonIcon icon={openOutline} className='inline-block ml-1' />
            </a>
        </div>
    </div>
}

const ReplyBlock = ({ message }: { message: Message }) => {
    const members = useContext(ChannelMembersContext)

    const user = useMemo(() => {
        if (message) {
            return members[message?.owner]
        } else {
            return undefined
        }
    }, [message])



    const date = message ? new Date(message?.creation) : null
    return <div className='px-2 py-1.5 my-2 rounded-e-sm bg-neutral-900 border-l-4 border-l-neutral-500'>
        {message && <div>
            <div className='flex items-baseline pb-1'>
                <p className='text-foreground font-medium text-sm leading-normal tracking-normal'>{user?.full_name ?? message.owner}</p>
                {date && <p className='text-xs text-foreground/60 font-normal pl-1.5'>on {DateObjectToFormattedDateStringWithoutYear(date)} at {DateObjectToTimeString(date)}</p>}
            </div>
            {message.message_type === 'Text' && <div className='text-sm text-foreground/60 line-clamp-3'>{parse(message.content ?? '')}</div>}
            {message.message_type === 'Image' && <div className='flex items-center space-x-2'>
                <img src={message.file} alt={`Image`} className='inline-block w-10 h-10 rounded-md' />
                <p className='text-sm font-semibold'>📸 &nbsp;Image</p>
            </div>}
            {message.message_type === 'File' && <p
                className='text-sm font-semibold'>📎 &nbsp;{message.file?.split('/')[3]}</p>}
        </div>
        }
    </div>
}