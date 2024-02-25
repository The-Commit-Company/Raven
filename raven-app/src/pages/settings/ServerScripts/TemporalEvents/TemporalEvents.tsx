import { ErrorBanner } from "@/components/layout/AlertBanner"
import { DateMonthAtHourMinuteAmPm } from "@/utils/dateConversions"
import { Box, Flex, Heading, Button, Section, Blockquote, Badge, Card, Table, Text, Code } from "@radix-ui/themes"
import { useFrappeGetDocList } from "frappe-react-sdk"
import { Link, useNavigate } from "react-router-dom"

export interface Props { }

export const TemporalEvents = (props: Props) => {

    const navigate = useNavigate()

    const { data, error } = useFrappeGetDocList('Server Script', {
        fields: ['name', 'script_type', 'event_frequency', 'creation', 'modified', 'disabled'],
        filters: [['script_type', '=', 'Scheduler Event']],
    })

    return (
        <Box className="lg:mx-[10rem] md:mx-[5rem] mt-9">
            <Flex justify={'between'}>
                <Heading>Temporal Events</Heading>
                <Button onClick={() => navigate('create')}>Add Event</Button>
            </Flex>
            <Section size={'2'}>
                <Blockquote size={'2'}>
                    Lets say you want to pay your dues every month. You can write a script that runs every month and pays your dues.
                    Temporal Events enables you to write custom scripts that are triggered by time or interval.
                </Blockquote>
            </Section>
            <Flex>
                {error && <ErrorBanner error={error} />}
                {data && <List data={data} />}
            </Flex>
        </Box>
    )
}


const List = ({ data }: { data: any }) => {
    return (
        <Box width={'100%'}>
            <Card>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Frequency</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Last modified</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {data?.map((item: any) => (<Table.Row key={item.name}>
                            <Table.RowHeaderCell>
                                <Link to={`${item.name}`}>
                                    <Text weight={'medium'} className="hover:underline">{item.name}</Text>
                                </Link>
                            </Table.RowHeaderCell>
                            <Table.Cell>
                                <Badge color={item.disabled ? 'gray' : 'green'}>{item.disabled ? "Disabled" : "Enabled"}</Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Code>{item.event_frequency}</Code>
                            </Table.Cell>
                            <Table.Cell>
                                <DateMonthAtHourMinuteAmPm date={item.modified} />
                            </Table.Cell>
                        </Table.Row>))}
                    </Table.Body>
                </Table.Root>
            </Card>
        </Box>
    )
}