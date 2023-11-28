import { EditorProvider, Extension, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import React, { useContext } from 'react'
import { TextFormattingMenu } from './TextFormattingMenu'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import './tiptap.styles.css'
import Mention from '@tiptap/extension-mention'
import { UserListContext } from '@/utils/users/UserListProvider'
import MentionList from './MentionList'
import tippy from 'tippy.js'
import { PluginKey } from '@tiptap/pm/state'
import { ChannelListContext, ChannelListContextType } from '@/utils/channel/ChannelListProvider'
import ChannelMentionList from './ChannelMentionList'
import { ToolPanel } from './ToolPanel'
import { RightToolbarButtons } from './RightToolbarButtons'
import { common, createLowlight } from 'lowlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import { Plugin } from 'prosemirror-state'
import { Box, Card, Inset } from '@radix-ui/themes'
const lowlight = createLowlight(common)

lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('js', js)
lowlight.register('ts', ts)
lowlight.register('json', json)
lowlight.register('python', python)
export interface ToolbarFileProps {
    fileInputRef: React.MutableRefObject<any>,
    addFile: (files: File) => void,
}
type TiptapEditorProps = {
    slotBefore?: React.ReactNode,
    slotAfter?: React.ReactNode,
    fileProps?: ToolbarFileProps,
    onMessageSend: (message: string, json: any) => Promise<void>,
    messageSending: boolean,
    defaultText?: string
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
const Tiptap = ({ slotAfter, slotBefore, fileProps, onMessageSend, messageSending, defaultText = '' }: TiptapEditorProps) => {

    const { users } = useContext(UserListContext)

    const { channels } = useContext(ChannelListContext) as ChannelListContextType


    // this is a dummy extension only to create custom keydown behavior
    const KeyboardHandler = Extension.create({
        name: 'keyboardHandler',
        addKeyboardShortcuts() {
            return {
                Enter: () => {

                    const isCodeBlockActive = this.editor.isActive('codeBlock');
                    const isListItemActive = this.editor.isActive('listItem');

                    //@ts-expect-error
                    const isSuggestionOpen = this.editor.state.userMention$.active || this.editor.state.channelMention$.active
                    const hasContent = this.editor.getText().trim().length > 0

                    if (isCodeBlockActive || isListItemActive || isSuggestionOpen) {
                        return false;
                    }
                    let html = ''
                    let json = {}
                    if (hasContent) {
                        html = this.editor.getHTML()
                        json = this.editor.getJSON()
                    }

                    this.editor.setEditable(false)

                    onMessageSend(html, json)
                        .then(() => {
                            this.editor.commands.clearContent();
                            this.editor.setEditable(true)
                        })
                        .catch(() => {
                            this.editor.setEditable(true)
                        })
                    return this.editor.commands.clearContent();
                },

                'Mod-Enter': () => {
                    const isCodeBlockActive = this.editor.isActive('codeBlock');
                    const isListItemActive = this.editor.isActive('listItem');
                    const hasContent = this.editor.getText().trim().length > 0
                    /**
                     * when inside of a codeblock and setting for sending the message with CMD/CTRL-Enter
                     * force calling the `onSubmit` function and clear the editor content
                     */
                    if (isCodeBlockActive) {
                        return this.editor.commands.newlineInCode();
                    }

                    if (isListItemActive) {
                        return false
                    }

                    if (!isCodeBlockActive && !isListItemActive) {
                        let html = ''
                        let json = {}
                        if (hasContent) {
                            html = this.editor.getHTML()
                            json = this.editor.getJSON()
                        }

                        this.editor.setEditable(false)
                        onMessageSend(html, json)
                            .then(() => {
                                this.editor.commands.clearContent();
                                this.editor.setEditable(true)
                            })
                            .catch(() => {
                                this.editor.setEditable(true)
                            })
                        return this.editor.commands.clearContent();
                    }

                    return false;
                },

                // 'Shift-Enter': () => {
                //     /**
                //      * currently we do not have an option to show a soft line break in the posts, so we overwrite
                //      * the behavior from tiptap with the default behavior on pressing enter
                //      */
                //     return this.editor.commands.first(({ commands }) => [
                //         () => commands.newlineInCode(),
                //         () => commands.createParagraphNear(),
                //         () => commands.liftEmptyBlock(),
                //         () => commands.splitBlock(),
                //     ]);
                // },
            };
        },
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    props: {
                        handleDOMEvents: {
                            drop(view, event) {
                                const hasFiles =
                                    event.dataTransfer &&
                                    event.dataTransfer.files &&
                                    event.dataTransfer.files.length

                                if (!hasFiles || !fileProps) {
                                    return
                                }

                                const images = Array.from(event.dataTransfer.files).filter(file =>
                                    /image/i.test(file.type)
                                )

                                if (images.length === 0) {
                                    return
                                }

                                event.preventDefault()

                                images.forEach(image => {
                                    fileProps.addFile(image)
                                })
                            },
                            paste(view, event) {
                                const hasFiles =
                                    event.clipboardData &&
                                    event.clipboardData.files &&
                                    event.clipboardData.files.length

                                if (!hasFiles || !fileProps) {
                                    return
                                }

                                const images = Array.from(
                                    event.clipboardData.files
                                ).filter(file => /image/i.test(file.type))

                                if (images.length === 0) {
                                    return
                                }

                                event.preventDefault()

                                images.forEach(image => {

                                    fileProps.addFile(image)
                                })
                            }
                        }
                    }
                })
            ]
        }
    });
    const extensions = [
        StarterKit.configure({
            heading: false,
            codeBlock: false,
        }),
        UserMention.configure({
            HTMLAttributes: {
                class: 'mention',
            },
            renderLabel({ options, node }) {
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
                            component = new ReactRenderer(ChannelMentionList, {
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
        }),
        CodeBlockLowlight.configure({
            lowlight
        }),
        KeyboardHandler
    ]

    return (
        <Box className='border rounded-md border-[var(--gray-5)] dark:border-[var(--gray-6)] dark:bg-[var(--gray-3)] shadow-md '>
            <EditorProvider
                extensions={extensions}
                content={defaultText}
                autofocus
                slotAfter={slotAfter}
                slotBefore={slotBefore}
            >
                <ToolPanel>
                    <TextFormattingMenu />
                    <RightToolbarButtons fileProps={fileProps} sendMessage={onMessageSend} messageSending={messageSending} />
                </ToolPanel>
            </EditorProvider>
        </Box>

    )
}

export default Tiptap