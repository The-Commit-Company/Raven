import { DeleteAlert } from "@/components/feature/settings/common/DeleteAlert"
import { TemporalEventsForm } from "@/components/feature/settings/temporal-events/TemporalEventsForm"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { useToast } from "@/hooks/useToast"
import { Badge, Box, Button, DropdownMenu, Flex, Heading, Section } from "@radix-ui/themes"
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"

export interface Props { }

export const ViewTemporalEvent = (props: Props) => {

    const { scriptID } = useParams<{ scriptID: string }>()

    const { data: eventData, error, mutate } = useFrappeGetDoc('Server Script', scriptID)

    return (
        <>
            {error && <ErrorBanner error={error} />}
            {eventData && <ViewTemporalEventPage data={eventData} onUpdate={mutate} />}
        </>
    )
}


const ViewTemporalEventPage = ({ data, onUpdate }: { data: any, onUpdate: () => void }) => {

    const [isOpen, setIsOpen] = useState(false)

    const navigate = useNavigate()

    const methods = useForm({
        defaultValues: {
            name: data.name,
            event_frequency: data.event_frequency,
            script: data.script,
            cron_format: {
                'minute': data.cron_format?.slice(0, 2) ?? '',
                'hour': data.cron_format?.slice(2, 4) ?? '',
                'day': data.cron_format?.slice(4, 6) ?? '',
                'month': data.cron_format?.slice(6, 8) ?? '',
                'dayOfWeek': data.cron_format?.slice(8, 10) ?? '',
            }
        }
    })

    const { updateDoc, error } = useFrappeUpdateDoc()

    const { toast } = useToast()

    const onSubmit = (data: any) => {
        let cronFormat = ''
        if (data.event_frequency === 'Cron') {
            cronFormat = data.cron_format?.minute + data.cron_format?.hour + data.cron_format?.day + data.cron_format?.month + data.cron_format?.dayOfWeek
        }
        updateDoc('Server Script', data.name, {
            event_frequency: data.event_frequency,
            cron_format: cronFormat,
            script: data.script,
        })
            .then(() => {
                onUpdate()
                toast({
                    title: `Temporal Event ${data.name} updated`,
                    variant: 'success',
                })
            })
    }

    const onStatusToggle = () => {
        updateDoc('Server Script', data.name, {
            disabled: !data.disabled
        })
            .then(() => {
                onUpdate()
                toast({
                    title: `Temporal Event ${data.name} ${data.disabled ? "enabled" : "disabled"}`,
                    variant: 'success',
                })
            })
    }

    const onClose = () => {
        setIsOpen(false)
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Box className="lg:mx-[10rem] md:mx-[5rem] mt-9">
                    <Button variant="ghost" onClick={() => navigate('../../scheduled-scripts')}>
                        <FiArrowLeft /> Temporal Events
                    </Button>
                    <Flex justify={'between'} mt={'6'}>
                        <Flex align={'center'} gap={'3'}>
                            <Heading>{data.name}</Heading>
                            <Badge color={data.disabled ? 'gray' : 'green'}>{data.disabled ? "Disabled" : "Enabled"}</Badge>
                        </Flex>
                        <Flex gap={'3'}>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    <Button variant="soft">
                                        Actions
                                        {/* <CaretDownIcon /> */}
                                    </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content>
                                    <DropdownMenu.Item onClick={onStatusToggle}>{data.disabled ? "Enable" : "Disable"}</DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item color="red" onClick={() => setIsOpen(true)}>
                                        Delete
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                            <DeleteAlert docname={data.name} isOpen={isOpen} onClose={onClose} path={'../../scheduled-scripts'} />
                            <Button type='submit'>Save</Button>
                        </Flex>
                    </Flex>
                    <Section size={'2'}>
                        <ErrorBanner error={error} />
                        <TemporalEventsForm edit />
                    </Section>
                </Box>
            </form>
        </FormProvider>
    )
}