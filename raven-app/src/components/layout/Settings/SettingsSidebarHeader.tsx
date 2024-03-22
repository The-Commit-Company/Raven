import { Flex, Text } from "@radix-ui/themes"
import { BiChevronLeft } from "react-icons/bi"
import { useNavigate } from "react-router-dom"

export interface Props { }

export const SidebarHeader = (props: Props) => {

    const navigate = useNavigate()

    return (
        <header>
            <Flex
                px='3'
                align='center'
                gap={'3'}
                pt='1'
                height='8'
                className="cursor-pointer"
                onClick={() => navigate('/channel')}
            >
                <BiChevronLeft size={'24px'} color="gray" />
                <Text as='span' size='4' weight={'medium'}>Settings</Text>
            </Flex>
        </header>
    )
}