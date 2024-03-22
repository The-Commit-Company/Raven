import { Integrations } from "@/components/feature/settings/Integrations"
import { ScrollArea, Flex } from "@radix-ui/themes"

export interface Props { }

export const SidebarBody = (props: Props) => {
    return (
        <ScrollArea type="hover" scrollbars="vertical" className='h-[calc(100vh-7rem)]'>
            <Flex direction='column' gap='2' className='overflow-x-hidden' px='2'>
                <Integrations />
            </Flex>
        </ScrollArea>
    )
}