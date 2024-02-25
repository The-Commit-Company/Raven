import { APIEventsForm } from "@/components/feature/settings/api-events/APIEventsForm"
import { DeleteAlert } from "@/components/feature/settings/common/DeleteAlert"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { useToast } from "@/hooks/useToast"
import { Badge, Box, Button, DropdownMenu, Flex, Heading, Section } from "@radix-ui/themes"
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"

export interface Props { }

export const ViewAPIEvent = (props: Props) => {

    const { apiID } = useParams<{ apiID: string }>()

    const { data: docEventData, error, mutate } = useFrappeGetDoc('Server Script', apiID)

    return (
        <>
            {error && <ErrorBanner error={error} />}
            {docEventData && <ViewAPIEventPage data={docEventData} onUpdate={mutate} />}
        </>
    )
}


const ViewAPIEventPage = ({ data, onUpdate }: { data: any, onUpdate: () => void }) => {

    const [isOpen, setIsOpen] = useState(false)

    const navigate = useNavigate()

    const methods = useForm({
        defaultValues: {
            name: data.name,
            api_method: data.api_method,
            allow_guest: data.allow_guest ?? false,
            script: data.script,
            enable_rate_limit: data.enable_rate_limit,
            rate_limit_count: data.rate_limit_count ?? 5,
            rate_limit_seconds: data.rate_limit_seconds ?? 86400,
        }
    })

    const { updateDoc, error } = useFrappeUpdateDoc()

    const { toast } = useToast()

    const onSubmit = (data: any) => {
        console.log(data)
        updateDoc('Server Script', data.name, {
            api_method: data.api_method,
            allow_guest: data.allow_guest,
            script: data.script,
            enable_rate_limit: data.enable_rate_limit,
            rate_limit_count: data.rate_limit_count,
            rate_limit_seconds: data.rate_limit_seconds,
        })
            .then(() => {
                onUpdate()
                toast({
                    title: `API Event ${data.name} updated`,
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
                    title: `API Event ${data.name} ${data.disabled ? "enabled" : "disabled"}`,
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
                    <Button variant="ghost" onClick={() => navigate('../../api-events')}>
                        <FiArrowLeft /> API Events
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
                            <DeleteAlert docname={data.name} isOpen={isOpen} onClose={onClose} path={'../../api-events'} />
                            <Button type='submit'>Save</Button>
                        </Flex>
                    </Flex>
                    <Section size={'2'}>
                        <ErrorBanner error={error} />
                        <APIEventsForm edit />
                    </Section>
                </Box>
            </form>
        </FormProvider>
    )
}