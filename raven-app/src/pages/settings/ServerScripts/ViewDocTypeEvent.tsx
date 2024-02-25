import { DeleteAlert } from "@/components/feature/settings/common/DeleteAlert"
import { DocTypeEventsForm } from "@/components/feature/settings/doctype-events/DocTypeEventsForm"
import { ErrorBanner } from "@/components/layout/AlertBanner"
import { useToast } from "@/hooks/useToast"
import { Badge, Box, Button, DropdownMenu, Flex, Heading, Section } from "@radix-ui/themes"
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { FiArrowLeft } from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"

export interface Props { }

export const ViewDocTypeEvent = (props: Props) => {

    const { eventID } = useParams<{ eventID: string }>()

    const { data: docEventData, error, mutate } = useFrappeGetDoc('Server Script', eventID)

    return (
        <>
            {error && <ErrorBanner error={error} />}
            {docEventData && <ViewDocTypeEventPage data={docEventData} onUpdate={mutate} />}
        </>
    )
}


const ViewDocTypeEventPage = ({ data, onUpdate }: { data: any, onUpdate: () => void }) => {

    const [isOpen, setIsOpen] = useState(false)

    const navigate = useNavigate()

    const methods = useForm({
        defaultValues: {
            name: data.name,
            reference_document_type: data.reference_doctype,
            document_event: data.doctype_event,
            script: data.script,
        }
    })

    const { updateDoc, error } = useFrappeUpdateDoc()

    const { toast } = useToast()

    const onSubmit = (data: any) => {
        updateDoc('Server Script', data.name, {
            reference_doctype: data.reference_document_type,
            doctype_event: data.document_event,
            script: data.script,
        })
            .then(() => {
                onUpdate()
                toast({
                    title: `DocType Event ${data.name} updated`,
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
                    title: `DocType Event ${data.name} ${data.disabled ? "enabled" : "disabled"}`,
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
                    <Button variant="ghost" onClick={() => navigate('../../doctype-events')}>
                        <FiArrowLeft /> DocType Events
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
                            <DeleteAlert docname={data.name} isOpen={isOpen} onClose={onClose} path={'../../doctype-events'} />
                            <Button type='submit'>Save</Button>
                        </Flex>
                    </Flex>
                    <Section size={'2'}>
                        <ErrorBanner error={error} />
                        <DocTypeEventsForm edit />
                    </Section>
                </Box>
            </form>
        </FormProvider>
    )
}