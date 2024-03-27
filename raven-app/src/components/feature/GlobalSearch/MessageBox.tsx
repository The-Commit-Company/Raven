import { useGetUserRecords } from "@/hooks/useGetUserRecords"
import { useCurrentChannelData } from "@/hooks/useCurrentChannelData"
import { DMChannelListItem } from "@/utils/channel/ChannelListProvider"
import { Box, Button, Flex, Link, Separator, Text, Tooltip } from '@radix-ui/themes'
import { MessageSenderAvatar, MessageContent, UserHoverCard } from "../chat/ChatMessage/MessageItem"
import { useGetUser } from "@/hooks/useGetUser"
import { Message } from "../../../../../types/Messaging/Message"
import { useMemo } from "react"
import { DateMonthYear } from "@/utils/dateConversions"
import { BiBookmarkMinus } from "react-icons/bi"
import { useToast } from "@/hooks/useToast"
import { FrappeConfig, FrappeContext } from "frappe-react-sdk"
import { useContext } from "react"

type MessageBoxProps = {
    message: Message
    handleScrollToMessage: (messageName: string, channelID: string) => void
}

export const MessageBox = ({ message, handleScrollToMessage }: MessageBoxProps) => {

    const { owner, creation, channel_id } = message
    const users = useGetUserRecords()

    const user = useGetUser(owner)
    const { channel } = useCurrentChannelData(channel_id)
    const channelData = channel?.channelData

    const channelName = useMemo(() => {
        if (channelData) {
            if (channelData.is_direct_message) {
                const peer_user_name = users[(channelData as DMChannelListItem).peer_user_id]?.full_name ?? (channelData as DMChannelListItem).peer_user_id
                return `DM with ${peer_user_name}`
            } else {
                return channelData.channel_name
            }
        }
    }, [channelData])

    const { call } = useContext(FrappeContext) as FrappeConfig
    const { toast } = useToast()

    const handleUnsavefromSavedMessages = (msg: Message) => {

        call.post('frappe.desk.like.toggle_like', {
            doctype: 'Raven Message',
            name: msg.name,
            add: 'No',
        }).then(() => {
            toast({
                title: 'Message unsaved',
                variant: 'accent',
                duration: 800,
            })
        })
            .catch(() => {
                toast({
                    title: 'Could not perform the action',
                    variant: 'destructive',
                    duration: 800,
                })
            })
    }

    return (
        <Flex direction='column' gap='2' className="group
        hover:bg-gray-100
                            dark:hover:bg-gray-4
                            p-2
                            rounded-md">
            <Flex gap='2'>
                <Text as='span' size='1'>{channelName}</Text>
                <Separator orientation='vertical' />
                <Text as='span' size='1' color='gray'><DateMonthYear date={creation} /></Text>

                <Link size='1' className="invisible group-hover:visible" onClick={() => handleScrollToMessage(message.name, channel_id)}>
                    View in channel
                </Link>
                <Tooltip content="Unsave Message">
                    <Button size='2' className="invisible group-hover:visible" style={{ marginLeft: 'auto' }} onClick={() => handleUnsavefromSavedMessages(message)}>
                        <BiBookmarkMinus size='22' />
                    </Button>
                </Tooltip>
            </Flex>

            <Flex gap='3'>
                <MessageSenderAvatar userID={owner} user={user} isActive={false} />
                <Flex direction='column' gap='1' justify='center'>
                    <Box mt='-1'>
                        <UserHoverCard user={user} userID={owner} isActive={false} />
                    </Box>
                    <MessageContent message={message} user={user} />
                </Flex>
            </Flex>
        </Flex>
    )
}