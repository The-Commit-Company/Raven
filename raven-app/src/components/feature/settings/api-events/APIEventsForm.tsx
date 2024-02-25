import { Label, HelperText } from "@/components/common/Form"
import { Flex, Box, TextField, TextArea, Checkbox, Grid, Code } from "@radix-ui/themes"
import { Controller, useFormContext } from "react-hook-form"

export interface Props {
    edit?: boolean
}

export const APIEventsForm = ({ edit = false }: Props) => {

    const { register, watch, control } = useFormContext()

    const enableRateLimit = watch('enable_rate_limit')

    return (
        <Flex direction="column" gap={'5'}>
            {!edit && <Box>
                <Label htmlFor="name" isRequired>Name</Label>
                <TextField.Input
                    {...register('name', { required: "Name is required.", maxLength: { value: 140, message: "Name cannot be more than 140 characters." } })}
                    id="name"
                    placeholder="e.g. Sales Invoice - delete_note"
                    autoFocus
                />
            </Box>}

            <Box>
                <Label htmlFor="api_method" isRequired>API Method</Label>
                <TextField.Input
                    {...register('api_method', { required: "API Method is required." })}
                    id="api_method"
                    placeholder="e.g. delete_note"
                    autoFocus={edit}
                />
                <HelperText>The API endpoint for which this event will be triggered (automatically prefixed with <Code>/api/method</Code>).</HelperText>
            </Box>

            <Box>
                <Controller
                    control={control}
                    name="allow_guest"
                    render={({ field }) => (
                        <Flex align={'center'} gap={'2'}>
                            <Checkbox
                                checked={field.value ? true : false}
                                onClick={() => field.onChange(!field.value)} />
                            <Label htmlFor="allow_guest">Allow anyone to use without logging in</Label>
                        </Flex>
                    )}
                />
            </Box>

            <Box>
                {/* TODO: Add a script editor here (maybe use Monaco Editor) */}
                <Label htmlFor="script" isRequired>Script</Label>
                <TextArea
                    {...register('script', { required: "Script is required." })}
                    rows={14}
                    placeholder={"Your script goes here"}
                />
                <HelperText>Your custom script to be be called via this API event.</HelperText>
            </Box>

            <Box>
                <Controller
                    control={control}
                    name="enable_rate_limit"
                    render={({ field }) => (
                        <Flex align={'center'} gap={'2'}>
                            <Checkbox
                                checked={field.value ? true : false}
                                onClick={() => field.onChange(!field.value)} />
                            <Label htmlFor="enable_rate_limit">Enable Rate Limit</Label>
                        </Flex>
                    )}
                />
            </Box>

            {enableRateLimit ? <Grid columns={"2"} gap={'5'}>
                <Box>
                    <Label htmlFor="rate_limit_count">Rate Limit Count</Label>
                    <TextField.Input
                        {...register('rate_limit_count')}
                        id="rate_limit_count"
                        type="number"
                        placeholder="e.g. 5"
                        autoFocus={enableRateLimit}
                    />
                    <HelperText>Number of requests allowed in the specified time.</HelperText>
                </Box>

                <Box>
                    <Label htmlFor="rate_limit_seconds">Rate Limit Seconds</Label>
                    <TextField.Input
                        {...register('rate_limit_seconds')}
                        id="rate_limit_seconds"
                        type="number"
                        placeholder="e.g. 86400"
                    />
                    <HelperText>Time period in seconds.</HelperText>
                </Box>
            </Grid> : null}
        </Flex>
    )
}