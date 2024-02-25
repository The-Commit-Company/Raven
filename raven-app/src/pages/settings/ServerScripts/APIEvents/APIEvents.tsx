import { ErrorBanner } from "@/components/layout/AlertBanner"
import { DateMonthAtHourMinuteAmPm } from "@/utils/dateConversions"
import { Badge, Blockquote, Box, Button, Card, Code, Flex, Heading, Section, Table, Text } from "@radix-ui/themes"
import { useFrappeGetDocList } from "frappe-react-sdk"
import { Link, useNavigate } from "react-router-dom"

export interface Props { }

export const APIEvents = (props: Props) => {

    const navigate = useNavigate()

    const { data, error } = useFrappeGetDocList('Server Script', {
        fields: ['name', 'script_type', 'api_method', 'creation', 'modified', 'disabled'],
        filters: [['script_type', '=', 'API']],
    })

    return (
        <Box className="lg:mx-[10rem] md:mx-[5rem] mt-9">
            <Flex justify={'between'}>
                <Heading>API Events</Heading>
                <Button onClick={() => navigate('create')}>Add Event</Button>
            </Flex>
            <Section size={'2'}>
                <Blockquote size={'2'}>
                    Lets say you want to perform some actions when an API Endpoint (method) is called.
                    API Events enables you to write custom scripts that are triggered by events in an API Endpoint.
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
                            <Table.ColumnHeaderCell>Endpoint</Table.ColumnHeaderCell>
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
                                <Code>{item.api_method}</Code>
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