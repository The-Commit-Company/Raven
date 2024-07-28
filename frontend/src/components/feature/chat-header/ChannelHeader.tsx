import { PageHeader } from "@/components/layout/Heading/PageHeader"
import { PinnedMessagesHeader } from "@/components/layout/Heading/PinnedMessagesHeader"
import { ChannelIcon } from "@/utils/layout/channelIcon"
import { ChannelListItem } from "@/utils/channel/ChannelListProvider"
import { EditChannelNameButton } from "../channel-details/rename-channel/EditChannelNameButton"
import { Flex, Heading } from "@radix-ui/themes"
import ChannelHeaderMenu from "./ChannelHeaderMenu"
import { ViewChannelMemberAvatars } from "./ViewChannelMemberAvatars"
import { BiChevronLeft } from "react-icons/bi"
import { Link } from "react-router-dom"
import { LuPin } from "react-icons/lu"
import { useFrappeGetCall } from "frappe-react-sdk"
import { PinnedMessages } from "@/types/RavenChannelManagement/PinnedMessages"

interface ChannelHeaderProps {
    channelData: ChannelListItem
}

export const ChannelHeader = ({ channelData }: ChannelHeaderProps) => {

    // The channel header has the channel name, the channel type icon, edit channel name button, and the view or add members button
    const { data, error } = useFrappeGetCall<{ message: PinnedMessages[] }>("raven.api.raven_message.get_pinned_messages", undefined, undefined, {
        revalidateOnFocus: false
    })

    return (
        <>
        <PageHeader>
            <Flex align='center'>
                <Link to='/channel' className="block bg-transparent hover:bg-transparent active:bg-transparent sm:hidden">
                    <BiChevronLeft size='24' className="block text-gray-12" />
                </Link>
                <Flex gap='4' align={'center'} className="group animate-fadein">
                    <Flex gap='1' align={'center'}>
                        <ChannelIcon type={channelData.type} size='18' />
                        <Heading className="text-lg sm:text-xl mb-0.5 text-ellipsis">{channelData.channel_name}</Heading>
                    </Flex>
                    <EditChannelNameButton channelID={channelData.name} channel_name={channelData.channel_name} channelType={channelData.type} disabled={channelData.is_archived == 1} />
                </Flex>
            </Flex>

            <Flex gap='2' align='center' className="animate-fadein">
                <ViewChannelMemberAvatars channelData={channelData} />
                <ChannelHeaderMenu channelData={channelData} />
            </Flex>
        </PageHeader>
        <PinnedMessagesHeader>
            <Flex direction="row" align="center" className="animate-fadein" gap='2'>
                <LuPin size="18" ></LuPin>
                Pinned Messages
                {/* { data?.message?.map((msg) => {return(<p>msg</p>)}) } */}
            </Flex>
        </PinnedMessagesHeader>
        </>
    )
}