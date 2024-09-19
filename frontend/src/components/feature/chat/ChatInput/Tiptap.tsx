import { BubbleMenu, EditorContent, EditorContext, Extension, ReactRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import React, { Suspense, lazy, useContext, useEffect, useMemo } from 'react'
import { TextFormattingMenu } from './TextFormattingMenu'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import './tiptap.styles.css'
import Mention from '@tiptap/extension-mention'
import { UserListContext } from '@/utils/users/UserListProvider'
import MentionList from './MentionList'
import tippy from 'tippy.js'
import { PluginKey } from '@tiptap/pm/state'
import { ChannelListContext, ChannelListContextType } from '@/utils/channel/ChannelListProvider'
import ChannelMentionList from './ChannelMentionList'
import { ToolPanel } from './ToolPanel'
import { RightToolbarButtons, SendButton } from './RightToolbarButtons'
import { common, createLowlight } from 'lowlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import { Plugin } from 'prosemirror-state'
import { Box, Flex, IconButton } from '@radix-ui/themes'
import { useSessionStickyState } from '@/hooks/useStickyState'
import { Message } from '../../../../../../types/Messaging/Message'
import Image from '@tiptap/extension-image'
import { EmojiSuggestion } from './EmojiSuggestion'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { BiPlus } from 'react-icons/bi'
import clsx from 'clsx'
import { ChannelMembers } from '@/hooks/fetchers/useFetchChannelMembers'
const MobileInputActions = lazy(() => import('./MobileActions/MobileInputActions'))

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
    isEdit?: boolean,
    slotBefore?: React.ReactNode,
    slotAfter?: React.ReactNode,
    placeholder?: string,
    sessionStorageKey?: string,
    clearReplyMessage?: () => void,
    disableSessionStorage?: boolean,
    fileProps?: ToolbarFileProps,
    onMessageSend: (message: string, json: any) => Promise<void>,
    messageSending: boolean,
    defaultText?: string,
    replyMessage?: Message | null,
    channelMembers?: ChannelMembers
}

export const UserMention = Mention.extend({
    name: 'userMention',
})
    .configure({
        suggestion: {
            char: '@',
            pluginKey: new PluginKey('userMention'),
        }
    })

export const ChannelMention = Mention.extend({
    name: 'channelMention',
})
    .configure({
        suggestion: {
            char: '#',
            pluginKey: new PluginKey('channelMention'),
        }
    })

const Tiptap = ({ isEdit, slotBefore, fileProps, onMessageSend, channelMembers, replyMessage, clearReplyMessage, placeholder = 'Type a message...', messageSending, sessionStorageKey = 'tiptap-editor', disableSessionStorage = false, defaultText = '' }: TiptapEditorProps) => {

    const { enabledUsers } = useContext(UserListContext)

    const channelMemberUsers = useMemo(() => {
        if (channelMembers) {
            // Filter enabled users to only include users that are in the channel
            return enabledUsers.filter((user) => user.name in channelMembers)
        } else {
            return enabledUsers
        }
    }, [channelMembers, enabledUsers])

    const { channels } = useContext(ChannelListContext) as ChannelListContextType

    // this is a dummy extension only to create custom keydown behavior
    const KeyboardHandler = Extension.create({
        name: 'keyboardHandler',
        addKeyboardShortcuts() {
            return {
                Enter: () => {

                    const isCodeBlockActive = this.editor.isActive('codeBlock');
                    const isListItemActive = this.editor.isActive('listItem');
                    const isTaskListActive = this.editor.isActive('taskList');

                    const hasContent = this.editor.getText().trim().length > 0

                    if (isCodeBlockActive || isListItemActive || isTaskListActive) {
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
                            this.editor.commands.clearContent(true);
                            this.editor.setEditable(true)
                            this.editor.commands.focus('start')
                        })
                        .catch(() => {
                            this.editor.setEditable(true)
                        })
                    return this.editor.commands.clearContent(true);
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
                                this.editor.commands.clearContent(true);
                                this.editor.setEditable(true)
                            })
                            .catch(() => {
                                this.editor.setEditable(true)
                            })
                        return this.editor.commands.clearContent(true);
                    }

                    return false;
                },
                Backspace: () => {
                    const isEditorEmpty = this.editor.isEmpty

                    if (isEditorEmpty) {
                        // Clear the reply message if the editor is empty
                        clearReplyMessage?.()
                        return this.editor.commands.clearContent(true)
                    }

                    return false
                },
                'Shift-Enter': () => {
                    return this.editor.commands.first(({ commands }) => [
                        () => commands.newlineInCode(),
                        () => commands.createParagraphNear(),
                        () => commands.liftEmptyBlock(),
                        () => commands.splitBlock(),
                    ]);
                },
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
            listItem: {
                HTMLAttributes: {
                    class: 'rt-Text text-sm'
                }
            },
            paragraph: {
                HTMLAttributes: {
                    class: 'rt-Text text-sm'
                }
            },
            code: {
                HTMLAttributes: {
                    class: 'pt-0.5 px-1 pb-px bg-[var(--gray-a3)] dark:bg-[#0d0d0d] text-[var(--ruby-a11)] dark-[var(--accent-a3)] text text-xs font-mono rounded border border-gray-4 dark:border-gray-6'
                }
            },
        }),
        TaskList,
        TaskItem.configure({
            nested: true,
        }),
        Underline,
        Highlight.configure({
            multicolor: true,
            HTMLAttributes: {
                class: 'bg-[var(--yellow-6)] dark:bg-[var(--yellow-11)] px-2 py-1'
            }
        }),
        Link.extend({ inclusive: false }).configure({
            autolink: true,
            protocols: ['mailto', 'https', 'http'],
        }),
        Placeholder.configure({
            // Pick a random placeholder from the list.
            placeholder,
        }),
        CodeBlockLowlight.extend({
            addKeyboardShortcuts() {
                return {
                    // this extends existing shortcuts instead of overwriting
                    ...this.parent?.(),
                    'Mod-Shift-E': () => this.editor.commands.toggleCodeBlock(),
                }
            }
        }).configure({
            lowlight
        }),
        Image.configure({
            inline: true,
        }),
        KeyboardHandler,
        UserMention.configure({
            HTMLAttributes: {
                class: 'mention',
            },
            renderHTML({ options, node }) {
                return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
            },
            suggestion: {
                items: (query) => {
                    return channelMemberUsers.filter((user) => user.full_name.toLowerCase().startsWith(query.query.toLowerCase()))
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
            renderHTML({ options, node }) {
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
        EmojiSuggestion
    ]

    const [content, setContent] = useSessionStickyState(defaultText, sessionStorageKey, disableSessionStorage)

    const isDesktop = useIsDesktop()

    const editor = useEditor({
        extensions,
        autofocus: 'end',
        content,
        editorProps: {
            attributes: {
                class: 'tiptap-editor' + (replyMessage ? ' replying' : '') + (isEdit ? ' editing-message' : '')
            }
        },
        onUpdate({ editor }) {
            setContent(editor.getHTML())
        }
    }, [replyMessage])



    useEffect(() => {
        if (isDesktop || isEdit) {
            setTimeout(() => {
                editor?.chain().focus().run()
            }, 50)
        }
    }, [replyMessage, editor, isDesktop, isEdit])


    if (isDesktop) {
        return (
            <Box className='border rounded-radius2 border-gray-300 dark:border-gray-500 dark:bg-gray-3'>
                <EditorContext.Provider value={{ editor }}>
                    {slotBefore}
                    <EditorContent editor={editor} />
                    <ToolPanel>
                        <TextFormattingMenu />
                        <RightToolbarButtons fileProps={fileProps} setContent={setContent} sendMessage={onMessageSend} messageSending={messageSending} />
                    </ToolPanel>
                </EditorContext.Provider>
            </Box>

        )
    } else {
        return <Box className={clsx('pt-2 pb-8 w-full bg-white dark:bg-gray-2 z-50 border-t border-t-gray-3 dark:border-t-gray-3',
            isEdit ? '' : 'fixed bottom-0 left-0 px-4'
        )}>
            <EditorContext.Provider value={{ editor }}>
                {slotBefore}
                <Flex align='end' gap='2' className='relative'>
                    {!isEdit &&
                        <div className='w-6'>
                            <Suspense fallback={<IconButton radius='full' color='gray' variant='soft' size='1' className='mb-2'>
                                <BiPlus size='18' />
                            </IconButton>}>
                                <MobileInputActions fileProps={fileProps} setContent={setContent} sendMessage={onMessageSend} messageSending={messageSending} />
                            </Suspense>
                        </div>
                    }
                    <BubbleMenu tippyOptions={{
                        arrow: true,
                        // followCursor: true,
                        offset: [90, 15],
                        inlinePositioning: true,
                    }}
                        editor={editor}>
                        <div className='bg-gray-1 dark:bg-gray-3 shadow-md p-2 rounded-md'>
                            <TextFormattingMenu />
                        </div>
                    </BubbleMenu>
                    <EditorContent editor={editor} />
                    <SendButton
                        size='1'
                        variant='soft'
                        className='bg-transparent mb-2 absolute right-1'
                        sendMessage={onMessageSend}
                        messageSending={messageSending}
                        setContent={setContent} />
                </Flex>
            </EditorContext.Provider>
        </Box>
    }



}

export default Tiptap