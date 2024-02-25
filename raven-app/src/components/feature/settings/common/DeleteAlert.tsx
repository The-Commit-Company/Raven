import { Loader } from "@/components/common/Loader"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { useToast } from "@/hooks/useToast"
import { AlertDialog, Button, Callout, Checkbox, Flex, Text } from "@radix-ui/themes"
import { useFrappeDeleteDoc } from "frappe-react-sdk"
import { useState } from "react"
import { FiAlertTriangle } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

export interface Props {
    isOpen: boolean,
    onClose: () => void
    docname: string
    path: string
}

export const DeleteAlert = ({ isOpen, onClose, docname, path }: Props) => {
    return (
        <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
            <AlertDialog.Content style={{ maxWidth: 450 }}>
                {/* Hii */}
                <AlertContent onClose={onClose} docname={docname} path={path} />
            </AlertDialog.Content>
        </AlertDialog.Root>
    )
}


type DeleteDocModalProps = {
    onClose: () => void,
    docname: string
    path: string
}

const AlertContent = ({ onClose, docname, path }: DeleteDocModalProps) => {

    const { deleteDoc, error, loading: deletingDoc, reset } = useFrappeDeleteDoc()

    const handleClose = () => {
        onClose()
        reset()
    }

    const { toast } = useToast()
    const navigate = useNavigate()

    const onSubmit = () => {
        if (docname) {
            deleteDoc('Server Script', docname)
                .then(() => {
                    onClose()
                    navigate(path)
                    toast({
                        title: `${docname} deleted`,
                        variant: 'success',
                    })
                })
        }
    }

    const [allowDelete, setAllowDelete] = useState(false)

    return (
        <>
            <AlertDialog.Title>
                Delete {docname}?
            </AlertDialog.Title>

            <Flex direction='column' gap='4'>
                <ErrorBanner error={error} />
                <Callout.Root color="red" size='1'>
                    <Callout.Icon>
                        <FiAlertTriangle size='18' />
                    </Callout.Icon>
                    <Callout.Text>
                        This action is permanent and cannot be undone.
                    </Callout.Text>
                </Callout.Root>
                {/* <Text size='2'>When you delete a channel, all messages from this channel will be removed immediately.</Text> */}
                {/* <Flex direction='column'>
                    <ul className={'list-inside'}>
                        <li><Text as='span' size='2'>All messages, including files and images will be removed</Text></li>
                        <li><Text as='span' size='2'>You can archive this channel instead to preserve your messages</Text></li>
                    </ul>
                </Flex> */}
                <Text size='2' as='label'>
                    <Flex gap="2" align={'center'}>
                        <Checkbox onClick={() => setAllowDelete(!allowDelete)} color='red' />
                        Yes, I understand, permanently delete this channel
                    </Flex>
                </Text>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                    <Button variant="soft" color="gray" onClick={handleClose}>
                        Cancel
                    </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                    <Button variant="solid" color="red" onClick={onSubmit} disabled={!allowDelete || deletingDoc}>
                        {deletingDoc && <Loader />}
                        {deletingDoc ? "Deleting" : "Delete"}
                    </Button>
                </AlertDialog.Action>
            </Flex>
        </>
    )
}