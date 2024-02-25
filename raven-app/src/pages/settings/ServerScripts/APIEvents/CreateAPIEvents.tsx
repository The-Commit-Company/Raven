import { APIEventsForm } from "@/components/feature/settings/api-events/APIEventsForm"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { useToast } from "@/hooks/useToast"
import { Box, Button, Flex, Heading, Section } from "@radix-ui/themes"
import { useFrappeCreateDoc } from "frappe-react-sdk"
import { FormProvider, useForm } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

export interface Props { }

export const CreateAPIEvent = (props: Props) => {

    const navigate = useNavigate()

    const methods = useForm()

    const { createDoc, error } = useFrappeCreateDoc()

    const { toast } = useToast()

    const onSubmit = (data: any) => {
        createDoc('Server Script', {
            name: data.name,
            script_type: 'API',
            api_method: data.api_method,
            allow_guest: data.allow_guest ?? false,
            script: data.script,
            enable_rate_limit: data.enable_rate_limit ?? false,
            rate_limit_count: data.rate_limit_count,
            rate_limit_seconds: data.rate_limit_seconds,
        })
            .then((doc) => {
                if (doc) {
                    navigate(`../${doc?.name}`)
                }
                toast({
                    title: `API Event ${data.name} updated`,
                    variant: 'success',
                })
            })
    }
    //TODO: Figure out a way to show _server_messages in the UI (especially the script editor might have some errors that we need to show to the user)
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Box className="lg:mx-[10rem] md:mx-[5rem] mt-9">
                    <Button variant="ghost" onClick={() => navigate('../../api-events')}>
                        <FiArrowLeft /> API Events
                    </Button>
                    <Flex justify={'between'} mt={'6'}>
                        <Heading>New API Event</Heading>
                        <Button type='submit'>Save</Button>
                    </Flex>
                    <Section size={'2'}>
                        <ErrorBanner error={error} />
                        <APIEventsForm />
                    </Section>
                </Box>
            </form>
        </FormProvider>
    )
}