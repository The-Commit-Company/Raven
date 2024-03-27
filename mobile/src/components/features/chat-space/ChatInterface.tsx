import { IonHeader, IonFooter, IonContent, useIonViewWillEnter } from '@ionic/react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { useMemo, useRef } from 'react'
import { IonButton, IonIcon, IonSpinner } from '@ionic/react'
import { createContext } from 'react'
import { ErrorBanner } from '../../layout'
import { ChatInput } from '../chat-input'
import { ChatHeader } from './chat-header'
import { ChannelListItem, DMChannelListItem, useChannelList } from '@/utils/channel/ChannelListProvider'
import { UserFields } from '@/utils/users/UserListProvider'
import { ChatLoader } from '@/components/layout/loaders/ChatLoader'
import { MessageActionModal, useMessageActionModal } from './MessageActions/MessageActionModal'
import { Button } from '@/components/ui/button'
import { BsPeople } from "react-icons/bs"
import { BiChevronLeft } from "react-icons/bi"
import { Link, useHistory } from 'react-router-dom'
import { IconButton } from '@/components/ui/icon-button'
import { arrowDownOutline } from 'ionicons/icons'
import useChatStream from './useChatStream'
import { useInView } from 'react-intersection-observer'
import { DateSeparator } from './chat-view/DateSeparator'
import { MessageBlockItem } from './chat-view/MessageBlock'
import ChatViewFirstMessage from './chat-view/ChatViewFirstMessage'

export type ChannelMembersMap = Record<string, UserFields>
export const ChannelMembersContext = createContext<ChannelMembersMap>({})

export const ChatInterface = ({ channel }: { channel: ChannelListItem | DMChannelListItem }) => {

    const conRef = useRef<HTMLIonContentElement>(null);

    useIonViewWillEnter(() => {
        conRef.current?.scrollToBottom()
    })

    const {
        messages,
        hasOlderMessages,
        loadOlderMessages,
        hasNewMessages,
        loadNewerMessages,
        loadingOlderMessages,
        highlightedMessage,
        scrollToMessage,
        goToLatestMessages,
        error,
        isLoading } = useChatStream(channel.name, conRef)


    const onReplyMessageClick = (messageID: string) => {
        scrollToMessage(messageID)
    }

    const { ref: oldLoaderRef } = useInView({
        fallbackInView: true,
        initialInView: false,
        skip: !hasOlderMessages || loadingOlderMessages,
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

    const { data: channelMembers } = useFrappeGetCall<{ message: ChannelMembersMap }>('raven.api.chat.get_channel_members', {
        channel_id: channel.name
    }, undefined, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false
    })

    const { selectedMessage, onMessageSelected, onDismiss } = useMessageActionModal()

    const { channels } = useChannelList()

    const parsedChannels = useMemo(() => {
        return channels.map(c => ({ id: c.name, value: c.channel_name }))
    }, [channels])

    const parsedMembers = useMemo(() => {
        if (channelMembers) {
            return Object.values(channelMembers.message).map((member) => ({ id: member.name, value: member.full_name }))
        }
        return []
    }, [channelMembers])

    const checkIsOpenChannel = () => (channel.type !== 'Open' && !channel.is_direct_message)

    const history = useHistory()

    return (
        <>
            <IonHeader>
                <div className='px-4 py-2 inset-x-0 top-0 overflow-hidden min-h-5 bg-background border-b-foreground/10 border-b'>
                    <div className='flex gap-5 items-center'>
                        <div className='flex items-center'>
                            <IconButton variant="ghost" icon={BiChevronLeft} onClick={() => history.goBack()} className='focus:bg-accent/40' />
                        </div>
                        <div className='flex items-center justify-between gap-2 w-full'>
                            <ChatHeader channel={channel} />
                            {
                                checkIsOpenChannel() && <div className='flex items-center'>
                                    {/* do not show settings button for open channels */}
                                    <Button variant="ghost" asChild className='hover:bg-transparent px-0 py-0 h-auto'>
                                        <Link to={`${channel.name}/channel-settings`}>
                                            <BsPeople size="18" className='text-foreground/80' />
                                        </Link>
                                    </Button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </IonHeader>
            <IonContent className='flex flex-col' fullscreen ref={conRef}>

                <div ref={oldLoaderRef}>
                    {hasOlderMessages && !isLoading && <div className='flex w-full min-h-8 py-4 justify-center items-center' >
                        <IonSpinner name='lines' />
                    </div>}
                </div>
                {!isLoading && !hasOlderMessages && <ChatViewFirstMessage channel={channel} />}
                {isLoading && <ChatLoader />}
                {error && <ErrorBanner error={error} />}


                {messages &&
                    <ChannelMembersContext.Provider value={channelMembers?.message ?? {}}>
                        <div className='flex flex-col'>
                            {messages.map((message) => {

                                if (message.message_type === "date") {
                                    return <DateSeparator
                                        key={`date-${message.creation}`}
                                        date={message.creation} />
                                } else {
                                    return (
                                        <MessageBlockItem
                                            key={`${message.name}_${message.modified}`}
                                            message={message}
                                            isHighlighted={highlightedMessage === message.name}
                                            onReplyMessageClick={onReplyMessageClick}
                                            onMessageSelect={onMessageSelected} />
                                    )
                                }
                            }
                            )}
                        </div>
                    </ChannelMembersContext.Provider>
                }

                {hasNewMessages && <div ref={newLoaderRef}>
                    <div className='flex w-full min-h-8 pb-4 justify-center items-center'>
                        <IonSpinner name='lines' />
                    </div>
                </div>}

                {/* Commented out the button because it was unreliable. We only scroll to bottom when the user is at the bottom. */}
                {hasNewMessages && <IonButton
                    size='small'
                    type="button"
                    onClick={goToLatestMessages}
                    shape='round'
                    // fill="outline"
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 "
                >
                    New messages
                    <IonIcon slot="end" icon={arrowDownOutline} />
                </IonButton>
                }
                <div className='h-8'>
                </div>
            </IonContent>

            <IonFooter
                hidden={!!error}
                className='block relative z-10 order-1 w-full'
            >
                <div
                    className='overflow-visible 
                    text-foreground
                    bg-background
                    border-t-foreground/10 
                    border-t-[1px]
                    pb-6
                    pt-1'
                >
                    <ChatInput channelID={channel.name} allMembers={parsedMembers} allChannels={parsedChannels} />
                </div>
            </IonFooter>
            <MessageActionModal selectedMessage={selectedMessage} onDismiss={onDismiss} />
        </>
    )

}