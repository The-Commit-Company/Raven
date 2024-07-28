import { FrappeConfig, FrappeContext, FrappeError, useFrappeDocTypeEventListener, useFrappeGetCall } from 'frappe-react-sdk'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { KeyedMutator } from 'swr'
import { RavenChannel } from '../../../../types/RavenChannelManagement/RavenChannel'
import { useSWRConfig } from 'frappe-react-sdk'
import { toast } from 'sonner'
import { getErrorMessage } from '@/components/layout/AlertBanner/ErrorBanner'

export type UnreadChannelCountItem = { name: string, user_id?: string, unread_count: number, is_direct_message: 0 | 1 }

export type UnreadCountData = {
    total_unread_count_in_channels: number,
    total_unread_count_in_dms: number,
    channels: UnreadChannelCountItem[]
}

export type ChannelListItem = Pick<RavenChannel, 'name' | 'channel_name' | 'type' |
    'channel_description' | 'is_direct_message' | 'is_self_message' |
    'is_archived' | 'creation' | 'owner' | 'last_message_details' | 'last_message_timestamp' | 'pinned_messages'>

export interface DMChannelListItem extends ChannelListItem {
    peer_user_id: string,
    is_direct_message: 1,
}

export interface SidebarChannelListItem extends ChannelListItem {
    is_archived: 0,
}

interface ChannelList {
    channels: ChannelListItem[],
    dm_channels: DMChannelListItem[]
}

export interface ChannelListContextType extends ChannelList {
    mutate: KeyedMutator<{ message: ChannelList }>,
    error?: FrappeError,
    isLoading: boolean
}
export const ChannelListContext = createContext<ChannelListContextType | null>(null)


export const ChannelListProvider = ({ children }: PropsWithChildren) => {

    const channelListContextData = useFetchChannelList()
    return (
        <ChannelListContext.Provider value={channelListContextData}>
            {children}
        </ChannelListContext.Provider>
    )
}

/**
 * Hook to fetch the channel list - all channels + DM's + other users if any
 * Also listens to the channel_list_updated event to update the channel list
 */
export const useFetchChannelList = (): ChannelListContextType => {

    const { mutate: globalMutate } = useSWRConfig()
    const { data, mutate, ...rest } = useFrappeGetCall<{ message: ChannelList }>("raven.api.raven_channel.get_all_channels", {
        hide_archived: false
    }, `channel_list`, {
        revalidateOnFocus: false,
        onError: (error) => {
            toast.error("There was an error while fetching the channel list.", {
                description: getErrorMessage(error)
            })
        }
    })

    useFrappeDocTypeEventListener('Raven Channel', () => {
        mutate()

        // Also update the unread channel count
        globalMutate('unread_channel_count')
    })

    const { sortedChannels, sortedDMChannels } = useMemo(() => {
        let sortedChannels = data?.message.channels ?? []
        let sortedDMChannels = data?.message.dm_channels ?? []

        sortedChannels = sortedChannels.sort((a, b) => {
            const bTimestamp = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0
            const aTimestamp = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0
            return new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime()
        })

        sortedDMChannels = sortedDMChannels.sort((a, b) => {
            const bTimestamp = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0
            const aTimestamp = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0
            return new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime()
        })

        return { sortedChannels, sortedDMChannels }
    }, [data])

    return {
        channels: sortedChannels,
        dm_channels: sortedDMChannels,
        mutate,
        ...rest
    }

}

// TODO: Is there a better way to do this? Maybe not fetch and use realtime events?
export const useUpdateLastMessageInChannelList = () => {

    const { mutate: globalMutate } = useSWRConfig()

    const { call } = useContext(FrappeContext) as FrappeConfig

    const updateLastMessageInChannelList = async (channelID: string) => {

        globalMutate(`channel_list`, async (channelList?: { message: ChannelList }) => {
            if (channelList) {

                let isChannelPresent = channelList.message.channels.find((channel) => channel.name === channelID)
                let isMainChannel = isChannelPresent ? true : false
                let isDMChannel = false
                if (!isChannelPresent) {
                    isChannelPresent = channelList.message.dm_channels.find((channel) => channel.name === channelID)
                    isDMChannel = isChannelPresent ? true : false
                }

                if (isChannelPresent) {
                    return call.get('raven.api.raven_channel.get_last_message_details', {
                        channel_id: channelID,
                    }).then(res => {
                        if (res && res.message) {
                            // Update the last message details in the channel list
                            let newChannels = channelList.message.channels
                            let newDMChannels = channelList.message.dm_channels

                            if (isMainChannel) {
                                newChannels = newChannels.map((channel) => {
                                    if (channel.name === channelID) {
                                        return {
                                            ...channel,
                                            last_message_details: res.message.last_message_details,
                                            last_message_timestamp: res.message.last_message_timestamp
                                        }
                                    }
                                    return channel
                                })
                            }

                            if (isDMChannel) {
                                newDMChannels = newDMChannels.map((channel) => {
                                    if (channel.name === channelID) {
                                        return {
                                            ...channel,
                                            last_message_details: res.message.last_message_details,
                                            last_message_timestamp: res.message.last_message_timestamp
                                        }
                                    }
                                    return channel
                                })
                            }

                            return {
                                message: {
                                    channels: newChannels,
                                    dm_channels: newDMChannels,
                                }
                            }
                        }
                        else {
                            return channelList
                        }
                    }
                    )
                } else {
                    return channelList
                }
            } else {
                return channelList
            }

        }, {
            revalidate: false
        })
    }

    return { updateLastMessageInChannelList }

}