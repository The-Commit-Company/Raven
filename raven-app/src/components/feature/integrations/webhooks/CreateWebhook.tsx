import { Webhook } from '@/types/Integrations/Webhook'
import { useFrappeCreateDoc } from 'frappe-react-sdk'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Flex, Separator, Text } from '@radix-ui/themes'
import { BiChevronLeft } from 'react-icons/bi'
import { ErrorBanner } from '@/components/layout/AlertBanner'
import { WebhookForm } from './WebhookForm'
import { useToast } from '@/hooks/useToast'
import { RavenWebhook } from '@/types/RavenIntegrations/RavenWebhook'

export const CreateWebhook = () => {

    const navigate = useNavigate()

    const methods = useForm<RavenWebhook>({
        defaultValues: {
            enabled: 1,
            timeout: 5
        }
    })
    const { createDoc, loading, reset, error } = useFrappeCreateDoc()

    const { toast } = useToast()

    const onSubmit = (data: RavenWebhook) => {
        createDoc('Raven Webhook', data)
            .then((doc) => {
                reset()
                methods.reset()
                toast({
                    title: "Webhook created successfully.",
                    variant: 'success',
                })
                return doc
            }).then((doc) => {
                navigate(`../webhooks/${doc.name}`)
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
                    <header>
                        <Text size='6' weight='bold'>Create Webhook</Text>
                    </header>
                    <Separator size='4' className={`bg-gray-4 dark:bg-gray-6`} />
                    <ErrorBanner error={error} />
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)}>
                            <WebhookForm />
                        </form>
                    </FormProvider>
                    <Button onClick={methods.handleSubmit(onSubmit)} disabled={loading} variant='solid' style={{
                        alignSelf: 'flex-end'
                    }} >
                        Create Webhook
                    </Button>
                </Flex>
            </Flex>
        </Flex>

    )
}

export const BackToList = () => {

    const navigate = useNavigate()

    return (
        <header>
            <Flex
                align='center'
                gap={'1'}
                className="cursor-pointer"
                onClick={() => navigate('/settings/integrations/webhooks')}
            >
                <BiChevronLeft size={'18px'} color="gray" />
                <Text as='span' size='1' weight={'medium'}>Back to the list</Text>
            </Flex>
        </header>
    )
}