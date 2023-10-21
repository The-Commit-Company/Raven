import { HStack, Stack } from '@chakra-ui/react'
import ListItem from '@tiptap/extension-list-item'
// import TextStyle from '@tiptap/extension-text-style'
import { EditorProvider, ReactRenderer, useCurrentEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import React, { useContext } from 'react'
import { TextFormattingMenu } from './TextFormattingMenu'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import './tiptap.styles.css'
import { NoNewLine } from './NoNewLine'
import Mention from '@tiptap/extension-mention'
import { ChannelMembers } from '@/utils/channel/ChannelMembersProvider'
import { UserListContext } from '@/utils/users/UserListProvider'
import MentionList from './MentionList'
import tippy from 'tippy.js'
import { PluginKey } from '@tiptap/pm/state'
import { ChannelListContext, ChannelListContextType } from '@/utils/channel/ChannelListProvider'
type TiptapEditorProps = {
    channelMembers: ChannelMembers
}

const COOL_PLACEHOLDERS = [
    "Sure - you can send your message via pigeons, only if you want them covered in poop 😷",
    "Delivering messages atop dragons 🐉 is available on a chargeable basis.",
    "Note 🚨: Service beyond the wall is currently disrupted due to bad weather.",
    "Pigeons just have better brand recognition tbh 🤷🏻",
    "Ravens double up as spies. Eyes everywhere 👀",
    "Ravens do not 'slack' off. See what we did there? 😉",
    "Were you expecting a funny placeholder? 😂",
    "Want to know who writes these placeholders? 🤔. No one.",
    "Type a message..."
]

const content = ''

const UserMention = Mention.extend({
    name: 'userMention',
})
    .configure({
        suggestion: {
            char: '@',
            pluginKey: new PluginKey('userMention'),
        }
    })

const ChannelMention = Mention.extend({
    name: 'channelMention',
})
    .configure({
        suggestion: {
            char: '#',
            pluginKey: new PluginKey('channelMention'),
        }
    })
export const Tiptap = ({ channelMembers }: TiptapEditorProps) => {

    const { users } = useContext(UserListContext)

    const { channels } = useContext(ChannelListContext) as ChannelListContextType

    const extensions = [
        // Color.configure({ types: [TextStyle.name, ListItem.name] }),
        // TextStyle.configure({ types: [ListItem.name] }),
        NoNewLine,
        StarterKit.configure({
            bulletList: {
                keepMarks: true,
                // keepAttributes: false,
            },
            orderedList: {
                keepMarks: true,
                // keepAttributes: false,
            },
        }),
        UserMention.configure({
            HTMLAttributes: {
                class: 'mention',
            },
            renderLabel({ options, node }) {
                console.log(node)
                return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
            },
            suggestion: {
                items: (query) => {
                    return users.filter((user) => user.full_name.toLowerCase().startsWith(query.query.toLowerCase()))
                        .slice(0, 10);
                },
                // char: '@',
                render: () => {
                    let component: any;
                    let popup: any;

                    return {
                        onStart: props => {
                            component = new ReactRenderer(MentionList, {
                                props,
                                editor: props.editor,
                            })

                            if (!props.clientRect) {
                                return
                            }

                            popup = tippy('body' as any, {
                                getReferenceClientRect: props.clientRect as any,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            })
                        },

                        onUpdate(props) {
                            component.updateProps(props)

                            if (!props.clientRect) {
                                return
                            }

                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            })
                        },

                        onKeyDown(props) {
                            if (props.event.key === 'Escape') {
                                popup[0].hide()

                                return true
                            }

                            return component.ref?.onKeyDown(props)
                        },

                        onExit() {
                            popup[0].destroy()
                            component.destroy()
                        },
                    }
                },

            }
        }),
        ChannelMention.configure({
            HTMLAttributes: {
                class: 'mention',
            },
            renderLabel({ options, node }) {
                console.log(node)
                return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
            },
            suggestion: {
                items: (query) => {
                    return channels.filter((channel) => channel.channel_name.toLowerCase().startsWith(query.query.toLowerCase()))
                        .slice(0, 10);
                },
                // char: '#',
                render: () => {
                    let component: any;
                    let popup: any;

                    return {
                        onStart: props => {
                            component = new ReactRenderer(MentionList, {
                                props,
                                editor: props.editor,
                            })

                            if (!props.clientRect) {
                                return
                            }

                            popup = tippy('body' as any, {
                                getReferenceClientRect: props.clientRect as any,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            })
                        },

                        onUpdate(props) {
                            component.updateProps(props)

                            if (!props.clientRect) {
                                return
                            }

                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            })
                        },

                        onKeyDown(props) {
                            if (props.event.key === 'Escape') {
                                popup[0].hide()

                                return true
                            }

                            return component.ref?.onKeyDown(props)
                        },

                        onExit() {
                            popup[0].destroy()
                            component.destroy()
                        },
                    }
                },

            }
        }),
        Underline,
        Highlight.configure({
            multicolor: true,
        }),
        Link.configure({
            protocols: ['mailto', 'https', 'http']
        }),
        Placeholder.configure({
            // Pick a random placeholder from the list.
            placeholder: COOL_PLACEHOLDERS[Math.floor(Math.random() * (COOL_PLACEHOLDERS.length))],
        })
    ]
    return (
        <EditorProvider extensions={extensions} content={content}>
            <TextFormattingMenu />
        </EditorProvider>
    )
}