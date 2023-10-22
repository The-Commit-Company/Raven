import { ModalTypes, useModalManager } from '@/hooks/useModalManager'
import { Box, IconButton, Popover, PopoverContent, PopoverTrigger, Portal, Tooltip, useColorMode } from '@chakra-ui/react'
import { useEffect } from 'react'
import { BsEmojiSmile } from 'react-icons/bs'
import { EmojiPicker } from '../../common/EmojiPicker/EmojiPicker'

interface EmojiPickerButtonProps {
    handleScroll: (newState: boolean) => void,
    saveReaction: (emoji: string) => void
}

export const EmojiPickerButton = ({ handleScroll, saveReaction }: EmojiPickerButtonProps) => {

    const { colorMode } = useColorMode()
    const modalManager = useModalManager()

    useEffect(() => {
        handleScroll(modalManager.modalType !== ModalTypes.EmojiPicker)
    }, [modalManager.modalType])

    const onEmojiPickerOpen = () => {
        modalManager.openModal(ModalTypes.EmojiPicker)
    }

    const onEmojiClick = (emoji: string) => {
        saveReaction(emoji)
        modalManager.closeModal()
    }

    return (
        <Box>
            <Popover
                isOpen={modalManager.modalType === ModalTypes.EmojiPicker}
                onClose={modalManager.closeModal}
                placement='auto-end'
                isLazy
                gutter={48}>
                <PopoverTrigger>
                    <Tooltip hasArrow label='find another reaction' size='xs' placement='top' rounded='md'>
                        <IconButton size='xs' aria-label={"pick emoji"} icon={<BsEmojiSmile />} onClick={onEmojiPickerOpen} />
                    </Tooltip>
                </PopoverTrigger>
                <Portal>
                    <Box zIndex={10}>
                        <PopoverContent border={'none'} rounded='lg'>
                            <EmojiPicker onSelect={onEmojiClick} />
                        </PopoverContent>
                    </Box>
                </Portal>
            </Popover>
        </Box>
    )
}