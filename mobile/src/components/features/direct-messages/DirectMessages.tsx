import { IonList, useIonToast } from '@ionic/react';
import { useFrappePostCall } from 'frappe-react-sdk'
import { Link, useHistory } from 'react-router-dom';
import { DMUser } from '@/pages/direct-messages/DirectMessageList';
import { DMChannelListItem, UnreadCountData, useChannelList } from '@/utils/channel/ChannelListProvider';
import { SquareAvatar } from '@/components/common/UserAvatar';
import { useIsUserActive } from '@/hooks/useIsUserActive';
import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export const PrivateMessages = ({ users, unread_count }: { users: DMUser[], unread_count?: UnreadCountData }) => {

    const { mutate } = useChannelList()

    const { call } = useFrappePostCall<{ message: string }>("raven.api.raven_channel.create_direct_message_channel")

    const history = useHistory();

    const [toast] = useIonToast();

    const onChannelCreate = async (user_id: string) => {
        return call({ user_id })
            .then((r) => {
                history.push(`channel/${r?.message}`)
                mutate()
            })
            .catch(() => {
                toast({
                    message: `Could not create a message channel with ${user_id}`,
                    color: "danger",
                    duration: 5000,
                    position: 'bottom',
                })
            })
    }


    return <IonList className='pb-4'>
        {users.map(dmUser => {
            if (dmUser.channel !== undefined) {
                return <DMChannelItem key={dmUser.name} user={dmUser as DMChannel} unreadCount={unread_count?.channels ?? []} />
            } else {
                return <UserItem key={dmUser.name} user={dmUser} onChannelCreate={onChannelCreate} />
            }
        })}
    </IonList>
}

/** This is to be used for users who have a channel */
interface DMChannel extends DMUser {
    channel: DMChannelListItem
}
const DMChannelItem = ({ user, unreadCount }: { user: DMChannel, unreadCount: UnreadCountData['channels'] }) => {

    const unreadCountForChannel = useMemo(() => unreadCount.find((unread) => unread.name == user.channel.name)?.unread_count, [user.channel.name, unreadCount])
    const isActive = useIsUserActive(user.name)

    return <Link to={`channel/${user.channel.name}`}>
        <li className='list-none px-4 py-2 active:bg-accent active:rounded' key={user.name}>
            <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-2 w-5/6'>
                    <SquareAvatar alt={user.full_name} src={user.user_image} isActive={isActive} />
                    <Label className='text-foreground w-5/6 cursor-pointer'>{user.full_name}</Label>
                </div>
                {unreadCountForChannel ? <Badge>{unreadCountForChannel < 100 ? unreadCountForChannel : '99'}</Badge> : null}
            </div>
        </li>
    </Link>
}

const UserItem = ({ user, onChannelCreate }: { user: DMUser, onChannelCreate: (user_id: string) => void }) => {
    const isActive = useIsUserActive(user.name)
    return <li className="px-4 py-2 flex active:bg-accent active:rounded" key={user.name} >
        <button onClick={() => onChannelCreate(user.name)} className='flex justify-between items-center w-full'>
            <div className="flex items-center space-x-2 w-full">
                <SquareAvatar alt={user.full_name} src={user.user_image} isActive={isActive} />
                <Label className="text-foreground cursor-pointer">{user.full_name}</Label>
            </div>
        </button>
    </li>
}