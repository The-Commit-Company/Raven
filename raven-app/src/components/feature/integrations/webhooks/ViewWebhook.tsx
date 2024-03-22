import { ErrorBanner } from "@/components/layout/AlertBanner"
import { FullPageLoader } from "@/components/layout/Loaders"
import { AlertDialog, Badge, Box, Button, DropdownMenu, Flex, IconButton, Separator, Text } from "@radix-ui/themes"
import { FrappeDoc, useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk"
import { FieldValues, FormProvider, useForm } from "react-hook-form"
import { useParams } from "react-router-dom"
import { KeyedMutator } from 'swr'
import { BackToList } from "./CreateWebhook"
import { WebhookForm } from "./WebhookForm"
import { useToast } from "@/hooks/useToast"
import { BiDotsVerticalRounded } from "react-icons/bi"
import { useState } from "react"
import { DIALOG_CONTENT_CLASS } from "@/utils/layout/dialog"
import { Loader } from "@/components/common/Loader"
import { RavenWebhook } from "@/types/RavenIntegrations/RavenWebhook"

const ViewWebhook = () => {

    const { ID } = useParams<{ ID: string }>()
    const { data, error, isLoading, mutate } = useFrappeGetDoc<RavenWebhook>('Raven Webhook', ID, undefined, {
        shouldRetryOnError: false,
    })

    return (
        <Box className='p-4'>
            {isLoading && <FullPageLoader />}
            {error && <ErrorBanner error={error} />}
            {data && <ViewWebhookPage data={data} mutate={mutate} />}

        </Box>
    )
}

export default ViewWebhook
ViewWebhook.displayName = 'ViewWebhook'

export const ViewWebhookPage = ({ data, mutate }: { data: FrappeDoc<RavenWebhook>, mutate: KeyedMutator<FrappeDoc<RavenWebhook>> }) => {

    const methods = useForm<RavenWebhook>({
        defaultValues: {
            ...data,
            docstatus: data.docstatus
        }
    })

    const { updateDoc, loading, reset, error } = useFrappeUpdateDoc()

    const { toast } = useToast()

    const isDirty = methods.formState.isDirty

    const onSubmit = async (data: FieldValues) => {
        return updateDoc('Raven Webhook', data.name, data)
            .then((doc) => {
                toast({
                    title: "Webhook updated successfully.",
                    variant: 'success',
                })
                reset()
                mutate()
                if (doc) {
                    methods.reset({
                        ...doc,
                        docstatus: doc.docstatus
                    })
                }
            })
    }

    const [open, setOpen] = useState(false)
    const onClose = () => {
        setOpen(false)
    }

    const onUpdateEnabled = () => {
        updateDoc('Raven Webhook', data.name, {
            enabled: !data.enabled
        }).then((doc) => {
            toast({
                title: "Webhook updated successfully.",
                variant: 'success',
            })
            reset()
            mutate()
        })
    }

    return (
        <Flex direction='column' gap='4' py='4' width={'100%'} height={'100%'} style={{
            alignItems: 'center',
            justifyContent: 'start',
            minHeight: '100vh'
        }}>
            <Flex direction='column' gap='4' pt={'4'} width='100%' style={{
                maxWidth: '700px'
            }} >
                <BackToList />
                <Flex direction='column' gap='4' width='100%' px={'2'}>
                    <Flex direction={'row'} gap={'2'} justify={'between'} align={'center'}>
                        <Flex direction={'row'} gap={'2'} align={'center'}>
                            <Text size='6' weight='bold'>{data?.name}</Text>
                            <Badge color={data.enabled ? 'green' : 'red'}>{data.enabled ? 'Enabled' : 'Disabled'}</Badge>
                        </Flex>
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <IconButton aria-label='Options' color='gray' variant='ghost' style={{
                                    // @ts-ignore
                                    '--icon-button-ghost-padding': '0',
                                    height: 'var(--base-button-height)',
                                    width: 'var(--base-button-height)',
                                }}>
                                    <BiDotsVerticalRounded />
                                </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content variant='soft'>
                                <DropdownMenu.Item color='gray' onClick={() => setOpen(true)} className="cursor-pointer">
                                    {data.enabled ? 'Disable' : 'Enable'} Webhook
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </Flex>
                    <Separator size='4' className={`bg-gray-4 dark:bg-gray-6`} />
                    <ErrorBanner error={error} />
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)}>
                            <WebhookForm isEdit={true} />
                        </form>
                    </FormProvider>
                    <Button onClick={methods.handleSubmit(onSubmit)} disabled={loading || !isDirty} variant='solid' style={{
                        alignSelf: 'flex-end'
                    }}>
                        Save Webhook
                    </Button>
                </Flex>
            </Flex>
            <AlertDialog.Root open={open} onOpenChange={setOpen}>
                <AlertDialog.Content className={DIALOG_CONTENT_CLASS}>
                    <AlertDialog.Title>
                        <Text>{data.enabled ? 'Disable' : 'Enable'} Webhook</Text>
                    </AlertDialog.Title>
                    <Flex direction={'column'} gap='2'>
                        <ErrorBanner error={error} />
                        <Text size='2'>Are you sure you want to {data.enabled ? 'disable' : 'enable'} this webhook?</Text>
                    </Flex>
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray" onClick={onClose}>
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button variant="solid" color="green" onClick={onUpdateEnabled} disabled={loading}>
                                {loading && <Loader />}
                                {loading ? "Updating" : data.enabled ? "Disable" : "Enable"}
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </Flex >
    )
}