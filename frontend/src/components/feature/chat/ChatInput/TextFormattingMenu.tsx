import { useCurrentEditor } from '@tiptap/react'
import { BiBold, BiCodeAlt, BiCodeBlock, BiHighlight, BiItalic, BiListOl, BiListUl, BiStrikethrough, BiUnderline, BiSolidQuoteAltRight, BiListCheck } from 'react-icons/bi'
import { DEFAULT_BUTTON_STYLE, ICON_PROPS } from './ToolPanel'
import { Box, Flex, IconButton, Separator, Tooltip } from '@radix-ui/themes'
import { getKeyboardMetaKeyString } from '@/utils/layout/keyboardKey'

export const TextFormattingMenu = () => {

    const { editor } = useCurrentEditor()

    const highlightBgColor = 'bg-accent-a3'

    if (!editor) {
        return <Box></Box>
    }
    return (
        <Flex gap='2' align='center' px='1' py='1'>
            <Flex gap='3' align='center'>
                <Tooltip content={getKeyboardMetaKeyString() + ' + B'} aria-label={getKeyboardMetaKeyString() + ' + B'}>
                    <IconButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        aria-label='bold'
                        variant='ghost'
                        title='Bold'
                        size='1'
                        className={editor.isActive('bold') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleBold()
                                .run()
                        }>
                        <BiBold {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
                <Tooltip content={getKeyboardMetaKeyString() + ' + I'} aria-label={getKeyboardMetaKeyString() + ' + I'}>
                    <IconButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        aria-label='italic'
                        title='Italic'
                        variant='ghost'
                        size='1'
                        className={editor.isActive('italic') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleItalic()
                                .run()
                        }>
                        <BiItalic {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
                <Tooltip content={getKeyboardMetaKeyString() + ' + U'} aria-label={getKeyboardMetaKeyString() + ' + U'}>
                    <IconButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        aria-label='underline'
                        title='Underline'
                        variant='ghost'
                        size='1'
                        className={editor.isActive('underline') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleUnderline()
                                .run()
                        }
                    >
                        <BiUnderline {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
            </Flex>
            <Separator orientation='vertical' />
            <Flex gap='3' align='center'>
                <Tooltip content={getKeyboardMetaKeyString() + ' + E'} aria-label={getKeyboardMetaKeyString() + ' + E'}>
                    <IconButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        aria-label='code'
                        variant='ghost'
                        size='1'
                        title='Code'
                        className={editor.isActive('code') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleCode()
                                .run()
                        }
                    >
                        <BiCodeAlt {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
                <Tooltip content={getKeyboardMetaKeyString() + '+ Shift + E'} aria-label={getKeyboardMetaKeyString() + '+ Shift + E'}>
                    <IconButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        aria-label='code block'
                        variant='ghost'
                        size='1'
                        title='Code Block'
                        className={editor.isActive('codeBlock') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleCodeBlock()
                                .run()
                        }
                    >
                        <BiCodeBlock {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
                {/* <Tooltip content={getKeyboardMetaKeyString() + ' + Shift + X'} aria-label={getKeyboardMetaKeyString() + ' + Shift + X'}> */}
                <IconButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    aria-label='strike'
                    variant='ghost'
                    size='1'
                    title='Strike'
                    className={editor.isActive('strike') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                    disabled={
                        !editor.can()
                            .chain()
                            .focus()
                            .toggleStrike()
                            .run()
                    }
                >
                    <BiStrikethrough {...ICON_PROPS} />
                </IconButton>
                {/* </Tooltip> */}
                {/* <Tooltip content={getKeyboardMetaKeyString() + ' + Shift + B'} aria-label={getKeyboardMetaKeyString() + ' + Shift + B'}> */}
                <IconButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label='blockquote'
                    className={editor.isActive('blockquote') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                    title='Blockquote'
                    size='1'
                    variant='ghost'
                    disabled={
                        !editor.can()
                            .chain()
                            .focus()
                            .toggleBlockquote()
                            .run()
                    }
                >
                    <BiSolidQuoteAltRight {...ICON_PROPS} />
                </IconButton>
                {/* </Tooltip> */}
            </Flex>
            <Separator orientation='vertical' />
            <Flex gap='3' align='center'>
                <Tooltip content={getKeyboardMetaKeyString() + ' + Shift + 7'} aria-label={getKeyboardMetaKeyString() + ' + Shift + 7'}>
                    <IconButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        aria-label='ordered list'
                        title='Ordered List'
                        size='1'
                        variant='ghost'
                        className={editor.isActive('orderedList') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleOrderedList()
                                .run()
                        }
                    >
                        <BiListOl {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
                <Tooltip content={getKeyboardMetaKeyString() + ' + Shift + 8'} aria-label={getKeyboardMetaKeyString() + ' + Shift + 8'}>
                    <IconButton
                        onClick={() => editor.chain().focus().liftEmptyBlock().toggleBulletList().run()}
                        aria-label='bullet list'
                        title='Bullet List'
                        size='1'
                        variant='ghost'
                        className={editor.isActive('bulletList') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleBulletList()
                                .run()
                        }
                    >
                        <BiListUl {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
                <Tooltip content={getKeyboardMetaKeyString() + ' + Shift + 9'} aria-label={getKeyboardMetaKeyString() + ' + Shift + 9'}>
                    <IconButton
                        onClick={() => editor.chain().focus().liftEmptyBlock().toggleTaskList().run()}
                        aria-label='check list'
                        title='Check List'
                        size='1'
                        variant='ghost'
                        className={editor.isActive('taskList') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleTaskList()
                                .run()
                        }
                    >
                        <BiListCheck {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
            </Flex>
            <Separator orientation='vertical' />
            <Flex gap='3' align='center'>
                <Tooltip content={getKeyboardMetaKeyString() + ' + Shift + H'} aria-label={getKeyboardMetaKeyString() + ' + Shift + H'}>
                    <IconButton
                        aria-label='highlight'
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        title='Highlight'
                        variant='ghost'
                        size='1'
                        className={editor.isActive('highlight') ? highlightBgColor : DEFAULT_BUTTON_STYLE}
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .toggleHighlight()
                                .run()
                        }
                    >
                        <BiHighlight {...ICON_PROPS} />
                    </IconButton>
                </Tooltip>
            </Flex>
        </Flex>
    )
}