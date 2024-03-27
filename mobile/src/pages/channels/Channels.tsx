import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonSearchbar } from '@ionic/react';
import { IoAdd } from 'react-icons/io5';
import { ErrorBanner } from '../../components/layout';
import { ChannelList } from '../../components/features/channels/ChannelList';
import { AddChannel } from '../../components/features/channels';
import { useMemo, useRef, useState } from 'react';
import { UnreadCountData, useChannelList } from '@/utils/channel/ChannelListProvider';
import { ChannelListLoader } from '../../components/layout/loaders/ChannelListLoader';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const Channels = () => {

    const pageRef = useRef()

    const [isOpen, setIsOpen] = useState(false)

    const { channels, isLoading, error } = useChannelList()

    const [searchInput, setSearchInput] = useState('')

    const filteredChannels = useMemo(() => {
        if (!channels) return []
        const activeChannels = channels.filter(channel => channel.is_archived == 0)
        const searchTerm = searchInput.toLowerCase()
        if (!searchTerm) return activeChannels
        return activeChannels.filter(channel => channel.channel_name.includes(searchTerm))
    }, [searchInput, channels])

    const { data: unreadCount } = useFrappeGetCall<{ message: UnreadCountData }>("raven.api.raven_message.get_unread_count_for_channels",
        undefined,
        'unread_channel_count', {
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: true,
    })

    return (
        <IonPage ref={pageRef}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Channels</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">Channels</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonToolbar>
                    <IonSearchbar
                        placeholder='Search'
                        onIonInput={(e) => setSearchInput(e.target.value!)}
                    >
                    </IonSearchbar>
                </IonToolbar>
                {isLoading && <ChannelListLoader />}
                {error && <ErrorBanner error={error} />}
                <li className='list-none active:bg-accent active:rounded'>
                    <Button variant="ghost" className='w-full flex justify-between items-center hover:bg-transparent ' onClick={() => setIsOpen(true)}>
                    <div className='flex items-center justify-start gap-2'>
                        <span>
                            <IoAdd size='18' className='text-foreground/80' />
                        </span>
                        <Label className="text-foreground/80 cursor-pointer">
                            Add Channel
                        </Label>
                    </div>
                    </Button>
                </li>
                <ChannelList data={filteredChannels ?? []} unread_count={unreadCount?.message}/>
                <AddChannel isOpen={isOpen} onDismiss={() => setIsOpen(false)} presentingElement={pageRef.current} />
            </IonContent>
        </IonPage>
    )
}