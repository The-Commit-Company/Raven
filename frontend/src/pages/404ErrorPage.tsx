import {
    Box,
    Button,
    Flex,
    Text,
    Link as LinkButton,
    IconButton
} from "@radix-ui/themes";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import shrugBro from "../../src/assets/Shrug-bro.svg"
import { LuGithub } from "react-icons/lu"

const NotFoundPage = () => {

    const navigate = useNavigate();
    const goToLoginPage = () => {
        navigate("/login");
    }

    const goToChannelPage = () => {
        navigate("/channel")
    }

    return (
        <Flex direction="column" align="center" gap="1" justify="center">
            <Flex direction="column" align="center" gap="1">
                <Box className="w-[30vw] max-sm:w-[70vw]">
                    <img src={shrugBro} ></img>
                </Box>

                <Text className="cal-sans" align="center" size="9"> 404 Error </Text>
                <Text className="cal-sans text-[3vw] max-sm:text-[5vw]" align="center">  Seems Like you have wondered too far ... </Text>

                <Flex direction="column" align="center" gap="3">
                    <Button className="w-[30vw] h-[5vh] max-sm:w-[60vw]" variant="soft" onClick={goToChannelPage}> BACK TO CHANNELS </Button>

                    <Button className="w-[30vw] h-[5vh] max-sm:w-[60vw]" variant="soft" onClick={goToLoginPage}> BACK TO LOGIN </Button>
                </Flex>
            </Flex>
        </Flex>
    )
}

export const Component = NotFoundPage
