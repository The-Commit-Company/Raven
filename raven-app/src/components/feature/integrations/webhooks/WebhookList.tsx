import { HelperText } from "@/components/common/Form"
import { Loader } from "@/components/common/Loader"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { FullPageLoader } from "@/components/layout/Loaders"
import { useToast } from "@/hooks/useToast"
import { Webhook } from "@/types/Integrations/Webhook"
import { RavenWebhook } from "@/types/RavenIntegrations/RavenWebhook"
import { DateMonthYear } from "@/utils/dateConversions"
import { DIALOG_CONTENT_CLASS } from "@/utils/layout/dialog"
import { Flex, Separator, Button, Text, Badge, IconButton, AlertDialog } from "@radix-ui/themes"
import { useFrappeDeleteDoc, useFrappeGetDocList } from "frappe-react-sdk"
import { useState } from "react"
import { BiEdit, BiTrash } from "react-icons/bi"
import { Link, useNavigate } from "react-router-dom"

export const WebhookList = () => {

    const { data, error, isLoading, mutate } = useFrappeGetDocList<RavenWebhook>('Raven Webhook', {
        fields: ['name', 'request_url', 'enabled', 'owner', 'creation']
    })

    const navigate = useNavigate()

    return (
        <Flex direction='column' gap='4' py='4' width={'100%'} height={'100%'} style={{
            alignItems: 'center',
            justifyContent: 'start',
            minHeight: '100vh'
        }}>
            <Flex direction='column' gap='4' pt={'4'} width='100%' style={{
                maxWidth: '700px'
            }} >
                <Flex direction='column' gap='4' width='100%' px={'2'}>
                    <Flex direction={'column'} gap={'2'} >
                        <header>
                            <Text size='6' weight='bold'>Webhook</Text>
                        </header>
                        <HelperText>Webhooks allow you to receive HTTP requests whenever an entity is created, updated, or deleted.
                        </HelperText>
                        <HelperText>
                            eg. User can create Webhook on Message Send, Delete, Edit.</HelperText>
                    </Flex>
                    <Separator size='4' className={`bg-gray-4 dark:bg-gray-6`} />
                    <ErrorBanner error={error} />
                    {isLoading && <FullPageLoader />}
                    {data?.length === 0 ? <Text size='2'>No webhooks found. Create new webhook by &nbsp;
                        <Link to={'./create'} style={{
                            textDecoration: 'underline'
                        }}>click here</Link>.
                    </Text> : <Flex direction='column' gap='4' width='100%'>
                        {data?.map((webhook, index) => (
                            <WebhookItem key={index} webhook={webhook} mutate={mutate} />
                        ))}
                    </Flex>}
                    <Button onClick={() => navigate('./create')} variant='solid' style={{
                        width: 'fit-content',
                        marginTop: '1rem'
                    }} >
                        New Webhook
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    )
}

export const WebhookItem = ({ webhook, mutate }: { webhook: RavenWebhook, mutate: () => void }) => {

    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const onClose = () => {
        setOpen(false)
    }

    return (
        <Flex direction='column' gap='2' width='100%' justify={'between'} className="border border-gray-4 dark:border-gray-6 rounded-radius2 p-3">
            <Flex direction='row' align='center' justify='between'>
                <Flex direction='column' gap='1'>
                    <Flex direction={'row'} gap={'2'}>
                        <Text size={'2'} weight={'bold'}>{webhook.name}</Text>
                        <Badge variant='outline' color={webhook.enabled ? 'green' : 'red'}>{webhook.enabled ? 'Enabled' : 'Disabled'}</Badge>
                    </Flex>
                    <Text size='1' style={{
                        fontStyle: 'italic',
                        color: 'gray'
                    }}>Created by {webhook.owner} on <DateMonthYear date={webhook.creation} /></Text>
                </Flex>
                <Flex direction={'row'} gap={'2'} align={'center'}>
                    <IconButton
                        variant="ghost"
                        color="gray"
                        aria-label="Click to edit webhook"
                        title='Edit webhook'
                        onClick={() => navigate(`./${webhook.name}`)}
                        style={{
                            // @ts-ignore
                            '--icon-button-ghost-padding': '0',
                            height: 'var(--base-button-height)',
                            width: 'var(--base-button-height)',
                        }}>
                        <BiEdit size='16' />
                    </IconButton>
                    <AlertDialog.Root open={open} onOpenChange={setOpen}>
                        <AlertDialog.Trigger>
                            <IconButton
                                variant="ghost"
                                color="red"
                                aria-label="Click to delete webhook"
                                title='Delete webhook'
                                onClick={() => { }}
                                style={{
                                    // @ts-ignore
                                    '--icon-button-ghost-padding': '0',
                                    height: 'var(--base-button-height)',
                                    width: 'var(--base-button-height)',
                                }}>
                                <BiTrash size='16' />
                            </IconButton>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content className={DIALOG_CONTENT_CLASS}>
                            <DeleteWebhookAlertContent webhhookID={webhook.name} onClose={onClose} mutate={mutate} />
                        </AlertDialog.Content>
                    </AlertDialog.Root>
                </Flex>

            </Flex>
        </Flex>
    )
}

export const DeleteWebhookAlertContent = ({ webhhookID, onClose, mutate }: { webhhookID: string, onClose: () => void, mutate: () => void }) => {

    const { deleteDoc, error, loading } = useFrappeDeleteDoc()

    const { toast } = useToast()

    const onDelete = () => {
        deleteDoc('Raven Webhook', webhhookID).then(() => {
            mutate()
            onClose()
            toast({
                title: "Webhook deleted successfully.",
                variant: 'success',
            })
        })
    }

    return (
        <>
            <AlertDialog.Title>
                <Text>{webhhookID}</Text>
            </AlertDialog.Title>
            <Flex direction={'column'} gap='2'>
                <ErrorBanner error={error} />
                <Text size='2'>Are you sure you want to delete this webhook?</Text>
            </Flex>
            <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                    <Button variant="soft" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                    <Button variant="solid" color="red" onClick={onDelete} disabled={loading}>
                        {loading && <Loader />}
                        {loading ? "Deleting" : `Delete`}
                    </Button>
                </AlertDialog.Action>
            </Flex>
        </>
    )

}