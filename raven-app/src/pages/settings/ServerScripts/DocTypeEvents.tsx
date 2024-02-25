import { ErrorBanner } from "@/components/layout/AlertBanner"
import { DateMonthAtHourMinuteAmPm } from "@/utils/dateConversions"
import { Badge, Blockquote, Box, Button, Card, Flex, Heading, Section, Table, Text } from "@radix-ui/themes"
import { useFrappeGetDocList } from "frappe-react-sdk"
import { Link, useNavigate } from "react-router-dom"

export interface Props { }

export const DocTypeEvents = (props: Props) => {

    const navigate = useNavigate()

    const { data, error } = useFrappeGetDocList('Server Script', {
        fields: ['name', 'script_type', 'reference_doctype', 'creation', 'modified', 'disabled'],
        filters: [['script_type', '=', 'DocType Event']],
    })

    return (
        <Box className="lg:mx-[10rem] md:mx-[5rem] mt-9">
            <Flex justify={'between'}>
                <Heading>DocType Events</Heading>
                <Button onClick={() => navigate('create')}>Add Event</Button>
            </Flex>
            <Section size={'2'}>
                <Blockquote size={'2'}>
                    You might want to perform some actions when a Sales Invoice is saved or a Purchase Order is submitted.
                    DocType Events enables you to write custom scripts that are triggered by events in a DocType.
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
                            <Table.ColumnHeaderCell>DocType</Table.ColumnHeaderCell>
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
                            <Table.Cell>{item.reference_doctype}</Table.Cell>
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