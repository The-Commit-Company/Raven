import { APIEventsForm } from "@/components/feature/settings/api-events/APIEventsForm"
import { TemporalEventsForm } from "@/components/feature/settings/temporal-events/TemporalEventsForm"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { useToast } from "@/hooks/useToast"
import { Box, Button, Flex, Heading, Section } from "@radix-ui/themes"
import { useFrappeCreateDoc } from "frappe-react-sdk"
import { FormProvider, useForm } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

export interface Props { }

export const CreateTemporalEvent = (props: Props) => {

    const navigate = useNavigate()

    const methods = useForm()

    const { createDoc, error } = useFrappeCreateDoc()

    const { toast } = useToast()

    const onSubmit = (data: any) => {
        let cronFormat = ''
        if (data.event_frequency === 'Cron') {
            cronFormat = data.cron_format?.minute + data.cron_format?.hour + data.cron_format?.day + data.cron_format?.month + data.cron_format?.dayOfWeek
        }
        createDoc('Server Script', {
            name: data.name,
            script_type: 'Scheduler Event',
            event_frequency: data.event_frequency,
            cron_format: cronFormat,
            script: data.script,
        })
            .then((doc) => {
                if (doc) {
                    navigate(`../${doc?.name}`)
                }
                toast({
                    title: `Temporal Event created`,
                    variant: 'success',
                })
            })
    }
    //TODO: Figure out a way to show _server_messages in the UI (especially the script editor might have some errors that we need to show to the user)
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Box className="lg:mx-[10rem] md:mx-[5rem] mt-9">
                    <Button variant="ghost" onClick={() => navigate('../../scheduled-scripts')}>
                        <FiArrowLeft /> Temporal Events
                    </Button>
                    <Flex justify={'between'} mt={'6'}>
                        <Heading>New Temporal Event</Heading>
                        <Button type='submit'>Save</Button>
                    </Flex>
                    <Section size={'2'}>
                        <ErrorBanner error={error} />
                        <TemporalEventsForm />
                    </Section>
                </Box>
            </form>
        </FormProvider>
    )
}