import { Label, HelperText } from "@/components/common/Form"
import { Flex, Box, TextField, TextArea, Link, Select } from "@radix-ui/themes"
import { Controller, useFormContext } from "react-hook-form"


export interface Props {
    edit?: boolean
}

export const TemporalEventsForm = ({ edit = false }: Props) => {

    const { register, watch, control } = useFormContext()

    const frequency = watch('event_frequency')

    return (
        <Flex direction="column" gap={'5'}>
            {!edit && <Box>
                <Label htmlFor="name" isRequired>Name</Label>
                <TextField.Input
                    {...register('name', { required: "Name is required.", maxLength: { value: 140, message: "Name cannot be more than 140 characters." } })}
                    id="name"
                    placeholder="e.g. Sales Invoice - Daily Reminder"
                    autoFocus
                />
            </Box>}

            <Box>
                <Label htmlFor="event_frequency">How often should this event be triggered?</Label>
                <Controller
                    control={control}
                    name="event_frequency"
                    render={({ field }) => (
                        <Select.Root {...field} onValueChange={(value) => field.onChange(value)} defaultValue="Daily">
                            <Select.Trigger style={{ width: "100%" }} placeholder="Select Frequency" autoFocus={edit} />
                            <Select.Content>
                                <Select.Group>
                                    <Select.Label>Temporal Events</Select.Label>
                                    <Select.Item value='Daily'>Daily</Select.Item>
                                    <Select.Item value='Weekly'>Weekly</Select.Item>
                                    <Select.Item value='Monthly'>Monthly</Select.Item>
                                    <Select.Item value='Yearly'>Yearly</Select.Item>
                                    <Select.Item value='Daily Long'>Daily Long</Select.Item>
                                    <Select.Item value='Weekly Long'>Weekly Long</Select.Item>
                                    <Select.Item value='Monthly Long'>Monthly Long</Select.Item>
                                    <Select.Item value='Yearly Long'>Yearly Long</Select.Item>
                                    <Select.Item value='Cron'>Custom</Select.Item>
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                    )}
                />
                <HelperText>The frequency at which this event will be triggered.</HelperText>
            </Box>

            {frequency === 'Cron' && <Box>
                <Label htmlFor="cron_format" isRequired>Cron Format</Label>
                {/* <TextField.Input
                    {...register('cron_format', { required: "Cron Format is required." })}
                    id="cron_format"
                    placeholder="e.g. 0 0 * * *"
                    autoFocus={edit}
                /> */}

                {/* //FIXME: Needs work - unstable component */}
                <AdvancedCronInput name="cron_format" label="Cron Format" />
                <HelperText>Starts with minute, hour, day of month, month, day of week. <Link href="https://crontab.guru/" target="_blank" rel="noreferrer">Learn more about cron format</Link></HelperText>
            </Box>}

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
        </Flex >
    )
}



/**
 * AdvancedCronInput
 * This component is used to input cron format in a more advanced way
 * @param {string} name
 * */
const AdvancedCronInput = ({ name, label, ...props }: { name: string; label: string }) => {

    const { register, setValue, watch, formState } = useFormContext();

    const error = formState.errors[name];
    const hasError = Boolean(error);

    const cronParts = ['minute', 'hour', 'day', 'month', 'dayOfWeek'];

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px' }}>
                {cronParts.map((part, index) => (
                    <input
                        key={part}
                        type="text"
                        maxLength={part === 'dayOfWeek' ? 1 : 2}
                        pattern="\d*"
                        {...register(`${name}.${part}`, {
                            required: 'This field is required',
                            pattern: {
                                value: /^\d+$/,
                                message: 'Please enter a valid number',
                            },
                        })}
                        autoFocus={watch('event_frequency') === 'Custom'}
                        onChange={(event) => setValue(`${name}.${part}`, event.target.value)}
                        style={{
                            width: '40px',
                            height: '40px',
                            textAlign: 'center',
                            fontSize: '16px',
                            border: `1px solid ${hasError ? 'red' : 'gray'}`,
                            borderRadius: '4px',
                            borderColor: hasError ? 'red' : 'blue',
                        }}
                    />
                ))}
            </div>
            {hasError && (
                <div role="alert" style={{ color: 'red' }}>
                    {String(error?.message)}
                </div>
            )}
        </div>
    );
};

export default AdvancedCronInput;
