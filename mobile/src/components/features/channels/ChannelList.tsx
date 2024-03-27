import { BiGlobe, BiHash, BiLockAlt } from 'react-icons/bi'
import { ChannelListItem, UnreadCountData } from '@/utils/channel/ChannelListProvider'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface ChannelListProps {
    data: ChannelListItem[],
    unread_count?: UnreadCountData
}

export const ChannelList = ({ data, unread_count }: ChannelListProps) => {
    return (
        <div className='pb-4'>
            {data?.map(channel => <ChannelItem
                channel={channel}
                unreadCount={unread_count?.channels ?? []}
                key={channel.name} />)}
        </div>
    )
}

const ChannelItem = ({ channel, unreadCount }: { channel: ChannelListItem, unreadCount: UnreadCountData['channels'] }) => {

    const unreadCountForChannel = useMemo(() => unreadCount.find((unread) => unread.name == channel.name)?.unread_count, [channel.name, unreadCount])

    return (
        <Link to={`/channel/${channel.name}`}>
            <li key={channel.name} className="list-none px-4 py-3 active:bg-accent active:rounded">
                <div className='flex justify-between items-center text-foreground'>
                    <div className='flex items-center space-x-2 w-5/6'>
                        <div>
                            {channel.type === "Private" ? <BiLockAlt size='18' /> : channel.type === "Public" ? <BiHash size='18' /> :
                                <BiGlobe size='18' />}
                        </div>
                        <Label className='w-5/6 cursor-pointer'>{channel.channel_name}</Label>
                    </div>
                    {unreadCountForChannel ? <Badge>{unreadCountForChannel < 100 ? unreadCountForChannel : '99'}</Badge> : null}
                </div>
            </li>
        </Link>
    )
}