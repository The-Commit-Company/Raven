import { SidebarGroup, SidebarGroupItem, SidebarGroupLabel, SidebarGroupList, SidebarItem } from "@/components/layout/Sidebar"
import { Flex, Text } from "@radix-ui/themes"
import { BiPlug } from "react-icons/bi"

export interface Props { }

export const Integrations = (props: Props) => {
    return (
        <SidebarGroup>
            <SidebarGroupItem gap='2' className={'pl-1.5'}>
                {/* <SidebarViewMoreButton onClick={toggle} /> */}
                <BiPlug />
                <Flex width='100%' justify='between' align='center' gap='2'>
                    <Flex gap='3' align='center'>
                        <SidebarGroupLabel className='cal-sans'>Integrations</SidebarGroupLabel>
                    </Flex>
                </Flex>
            </SidebarGroupItem>
            <SidebarGroup>
                <SidebarGroupList>
                    <IntegrationsItem route='/settings/integrations/webhooks' label='Webhooks' />
                </SidebarGroupList>
            </SidebarGroup>
        </SidebarGroup>
    )
}


export const IntegrationsItem = ({ route, label }: { route: string, label: string }) => {

    return (
        <SidebarItem to={route ? route : "*"} className={'py-1.5'}>
            <Flex justify='between' align={'center'} width='100%'>
                <Text size='2' className="text-ellipsis line-clamp-1" as='span' weight={'regular'}>{label}</Text>
            </Flex>
        </SidebarItem>
    )
}