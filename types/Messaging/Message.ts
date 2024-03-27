export type Message = FileMessage | TextMessage | ImageMessage

export interface BaseMessage {
    name: string,
    owner: string,
    _liked_by: string,
    channel_id: string,
    creation: string,
    modified: string,
    message_type: 'Text' | 'File' | 'Image' | 'Poll',
    message_reactions?: string | null,
    is_continuation: 1 | 0
    is_reply: 1 | 0
    linked_message?: string | null
    link_doctype?: string
    link_document?: string
    is_edited: 1 | 0
    /** JSON as string */
    replied_message_details?: string,
    poll_id?: string
}

export interface FileMessage extends BaseMessage {
    text: string,
    file: string,
    message_type: 'File'
}

export interface ImageMessage extends BaseMessage {
    text: string,
    file: string,
    message_type: 'Image'
    thumbnail_width?: number,
    thumbnail_height?: number,
    image_thumbnail?: string,
}

export interface TextMessage extends BaseMessage {
    text: string,
    message_type: 'Text',
    content?: string
}

export type DateBlock = {
    block_type: 'date',
    data: string
}

export type MessageBlock = {
    block_type: 'message',
    data: Message
}

export type MessagesWithDate = (DateBlock | MessageBlock)[]