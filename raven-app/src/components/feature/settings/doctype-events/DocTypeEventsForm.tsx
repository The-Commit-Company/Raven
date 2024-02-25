import { HelperText, Label } from "@/components/common/Form"
import { Box, Flex, Grid, Link, Select, TextArea, TextField } from "@radix-ui/themes"
import { useFormContext, Controller } from "react-hook-form"

export interface Props {
    edit?: boolean
}

export const DocTypeEventsForm = ({ edit = false }: Props) => {

    const { register, control } = useFormContext()

    return (
        <Flex direction="column" gap={'5'}>
            {!edit && <Box>
                <Label htmlFor="name" isRequired>Name</Label>
                <TextField.Input
                    {...register('name', { required: "Name is required.", maxLength: { value: 140, message: "Name cannot be more than 140 characters." } })}
                    id="name"
                    placeholder="e.g. Sales Invoice Before Save"
                    autoFocus
                />
            </Box>}

            <Grid columns={"2"} gap={'5'} p={'0'}>
                <Box>
                    <Label htmlFor="reference_document_type" isRequired>Reference Document Type</Label>
                    <TextField.Input
                        {...register('reference_document_type', { required: "Reference Document Type is required." })}
                        id="reference_document_type"
                        placeholder="e.g. Sales Invoice"
                        autoFocus={edit}
                    />
                    <HelperText>The event will be triggered for this DocType.</HelperText>
                </Box>

                <Box>
                    <Label htmlFor="document_event">DocType Event</Label>
                    <Controller
                        control={control}
                        name="document_event"
                        render={({ field }) => (
                            <Select.Root {...field} onValueChange={(value) => field.onChange(value)} defaultValue="Before Insert">
                                <Select.Trigger style={{ width: "100%" }} placeholder="Select Event" />
                                <Select.Content>
                                    <Select.Group>
                                        <Select.Label>DocType Event</Select.Label>
                                        <Select.Item value='Before Insert'>Before Insert</Select.Item>
                                        <Select.Item value='Before Validate'>Before Validate</Select.Item>
                                        <Select.Item value='Before Save'>Before Save</Select.Item>
                                        <Select.Item value='After Insert'>After Insert</Select.Item>
                                        <Select.Item value='After Save'>After Save</Select.Item>
                                        <Select.Item value='Before Submit'>Before Submit</Select.Item>
                                        <Select.Item value='After Submit'>After Submit</Select.Item>
                                        <Select.Item value='Before Cancel'>Before Cancel</Select.Item>
                                        <Select.Item value='After Cancel'>After Cancel</Select.Item>
                                        <Select.Item value='Before Save (Submitted Documents)'>Before Save (Submitted Documents)</Select.Item>
                                        <Select.Item value='After Save (Submitted Documents)'>After Save (Submitted Documents)</Select.Item>
                                        <Select.Item value='On Payment Authorization'>On Payment Authorization</Select.Item>
                                    </Select.Group>
                                </Select.Content>
                            </Select.Root>
                        )}
                    />
                    <HelperText>The event on which you want to run this script. <Link href="https://frappeframework.com/docs/user/en/basics/doctypes/controllers" target="_blank">Learn more</Link></HelperText>
                </Box>
            </Grid>

            <Box>
                {/* TODO: Add a script editor here (maybe use Monaco Editor) */}
                <Label htmlFor="script" isRequired>Script</Label>
                <TextArea
                    {...register('script', { required: "Script is required." })}
                    rows={14}
                    placeholder={"Your script goes here"}
                />
                <HelperText>Your custom script to be be called via this document event.</HelperText>
            </Box>
        </Flex>
    )
}