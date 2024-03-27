import { BiGlobe, BiHash, BiLock } from "react-icons/bi"
import { ChannelListItem } from "@/utils/channel/ChannelListProvider";

export const ChannelHeader = ({ channel }: { channel: ChannelListItem }) => {
    const isLongName = channel.channel_name.length > 40
    const ICON_SIZE = '18px'

    return (
        <div >
            <div className="flex flex-col items-baseline ">
                <div className='flex items-center gap-1'>
                    {channel.type === 'Private' ? <BiLock fontSize={ICON_SIZE} /> : channel.type === 'Public' ? <BiHash fontSize={ICON_SIZE} /> : <BiGlobe fontSize={ICON_SIZE} />}
                    <span className='text-lg font-medium cal-sans leading-normal'>
                        {isLongName ? channel.channel_name.substring(0, 40) + '...' : channel.channel_name}
                    </span>
                </div>
                {/* To-Do: Add count of members here */}
                <span className="text-xs text-foreground/80 pl-5 tracking-wide">{null}</span>
            </div>
        </div>
    )
}