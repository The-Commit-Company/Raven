import { HStack, Stack } from '@/components/layout/Stack'
import { RavenAIFunction } from '@/types/RavenAI/RavenAIFunction'
import { DIALOG_CONTENT_CLASS } from '@/utils/layout/dialog'
import { Badge, Box, Button, ButtonProps, Dialog, IconButton, Separator, Switch, Text, TextArea, VisuallyHidden } from '@radix-ui/themes'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { VariableType } from './FunctionConstants'
import { BiTrashAlt } from 'react-icons/bi'
import VariableDialog from './VariableDialog'
import { ErrorBoundary } from "react-error-boundary";
import { toast } from 'sonner'
import { FiEdit } from 'react-icons/fi'

type Props = {}

/**
 * This component helps users define their function schema in JSON format and also set required variables + default values for them.
 * 
 */
const VariableBuilder = (props: Props) => {

    const { control, getValues, setValue, watch } = useFormContext<RavenAIFunction>()

    const type = watch('type')


    const [viewMode, setViewMode] = useState<'json' | 'builder'>('builder')

    const [error, setError] = useState<string | undefined>(undefined)

    const formatJSON = () => {
        try {
            const value = getValues('params')
            const json = typeof value === 'string' ? JSON.parse(value) : value

            setValue('params', JSON.stringify(json, null, 4))
        } catch (e) {
            toast.error('Error formatting JSON. Please check your JSON.')
            setError((e as Error).message)
        }

    }

    if (type !== 'Custom Function') {
        return null
    }


    return (
        <Box className='py-2'>
            <Stack>
                <HStack justify='between' align='center'>
                    <Text size='3' weight='bold'>Variables</Text>
                    <HStack align='center' gap='4'>
                        {viewMode === 'json' && <Button color='gray' className='not-cal font-medium' variant='ghost' type='button' onClick={formatJSON}>Format JSON</Button>}
                        <HStack align='center'>
                            <Text weight='medium' size='2'>Builder</Text>
                            <Switch size='2' checked={viewMode === 'json'} onCheckedChange={(checked) => setViewMode(checked ? 'json' : 'builder')} />
                            <Text weight='medium' size='2'>JSON</Text>
                        </HStack>
                    </HStack>
                </HStack>
                {error && <Text size='2' color='red'>{error}</Text>}
                <Controller
                    control={control}
                    name='params'
                    render={({ field }) => {

                        if (viewMode === 'builder') {
                            try {
                                const json = typeof field.value === 'string' ? JSON.parse(field.value) : field.value
                                return <ErrorBoundary fallback={<Text size='2' color='red'>Error loading variables in the builder. Please check your JSON structure.</Text>}>
                                    <VariableBuilderField json={json} onChange={(j) => field.onChange(JSON.stringify(j, null, 4))} />
                                </ErrorBoundary>
                            } catch (e) {
                                return <Text size='2' color='red'>Error loading variables in the builder. Please check your JSON structure.</Text>
                            }
                        } else {
                            return <TextArea
                                rows={30}
                                resize='vertical'
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                            />
                        }

                    }}
                />
            </Stack>

        </Box>

    )
}

const VariableBuilderField = ({ json, onChange, isNested }: { json: Record<string, any>, onChange: (json: Record<string, any>) => void, isNested?: boolean }) => {

    const [editingVariable, setEditingVariable] = useState<{ name: string, properties: VariableType } | undefined>(undefined)

    const properties: Record<string, VariableType> = json.properties || {}

    const addVariable = (name: string, newProperty: any) => {
        onChange({
            type: 'object',
            properties: {
                ...properties,
                [name]: newProperty
            }
        })

    }

    const removeVariable = (name: string) => {

        const newProperties = { ...properties }
        delete newProperties[name]
        onChange({
            type: 'object',
            properties: newProperties
        })
    }

    const onObjectChange = (name: string, objProps: Record<string, VariableType>) => {
        onChange({
            type: 'object',
            properties: {
                ...properties,
                [name]: objProps
            }
        })
    }

    return <Stack>
        <Stack gap='1'>
            {Object.entries(properties).length === 0 && <Text size='2' color='gray' className='text-center pt-4'>No variables defined</Text>}
            {Object.entries(properties).map(([key, value]) => {
                return <Stack key={key} className='bg-gray-2 dark:bg-gray-4 p-2.5 rounded-md shadow-sm hover:bg-gray-3 dark:hover:bg-gray-5'>
                    <HStack
                        justify='between'
                        align='center'
                    >
                        <Stack gap='1'>
                            <HStack align='center'>
                                <Text className='font-semibold' size='2'>{key}</Text>
                                <HStack>
                                    <Badge color={value.type === 'object' ? 'blue' : 'purple'}>{value.type ? value.type.charAt(0).toUpperCase() + value.type.slice(1) : 'Object'}</Badge>
                                    {value.required && <Badge color='red'>Required</Badge>}
                                </HStack>
                            </HStack>
                            <Text size='2' color='gray'>{value.description}</Text>

                            {(value.type === 'string' || value.type === 'number' || value.type === 'boolean') && value.default && <Text as='span' weight={'medium'} size='2' color='gray'>Default: {value.default}</Text>}
                            {(value.type === 'string' || value.type === 'number') && value.enum && <Text as='span' size='2' color='gray' weight={'medium'}>Options: {value.enum?.split('\n').join(', ')}</Text>}
                        </Stack>

                        <HStack align='center' pr='2' gap='4'>
                            <IconButton size='2' color='gray' variant='ghost'
                                type='button'
                                onClick={() => setEditingVariable({
                                    name: key,
                                    properties: value,
                                })}><FiEdit size='16' className='text-gray-10' /></IconButton>
                            <IconButton size='2' color='red' variant='ghost'
                                type='button'
                                onClick={() => removeVariable(key)}><BiTrashAlt size='16' /></IconButton>
                        </HStack>
                    </HStack>
                    {value.type === 'object' &&
                        <Stack>
                            <Separator className='w-full' />
                            <Box ml='8' p='2' className='bg-white dark:bg-gray-2 rounded-md'>
                                <VariableBuilderField
                                    isNested
                                    json={value}
                                    onChange={(v) => onObjectChange(key, v)} />
                            </Box>
                        </Stack>

                    }
                </Stack>
            })}
            <HStack py={'3'} justify={isNested ? 'center' : 'start'}>
                <AddVariablePopover onAdd={addVariable} />
            </HStack>
        </Stack>
        <EditVariableDialog
            variable={editingVariable}
            onSubmit={addVariable} isOpen={editingVariable !== undefined}
            onOpenChange={(v) => !v && setEditingVariable(undefined)} />
    </Stack>
}

const AddVariablePopover = ({ onAdd, buttonProps }: { onAdd: (name: string, property: Partial<VariableType>) => void, buttonProps?: ButtonProps }) => {

    const [isOpen, setIsOpen] = useState(false)

    const onSubmit = (name: string, props: Partial<VariableType>) => {
        onAdd(name, props)
        setIsOpen(false)
    }

    return <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger>
            <Button size='2' variant='soft' {...buttonProps}>Add Variable</Button>
        </Dialog.Trigger>
        <Dialog.Content className={DIALOG_CONTENT_CLASS}>
            <Dialog.Title>Add Variable</Dialog.Title>
            <Dialog.Description>Add a new variable to your function schema.</Dialog.Description>
            <VariableDialog onAdd={onSubmit} allowNameChange={true} />
        </Dialog.Content>
    </Dialog.Root>
}

const EditVariableDialog = ({ variable, onSubmit, isOpen, onOpenChange }: { variable?: { name: string, properties: VariableType }, onSubmit: (name: string, properties: Partial<VariableType>) => void, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) => {

    return <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
        <Dialog.Content className={''}>
            <Dialog.Title>Edit Variable</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Edit the variable to your function schema.</Dialog.Description>
            </VisuallyHidden>

            <VariableDialog onAdd={onSubmit} allowNameChange={false} defaultValues={variable?.properties} name={variable?.name} />
        </Dialog.Content>
    </Dialog.Root>
}

export default VariableBuilder