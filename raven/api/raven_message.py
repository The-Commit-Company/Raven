import frappe
from frappe import _
from frappe.model.document import Document
from datetime import timedelta
from frappe.query_builder.functions import Count, Coalesce
from frappe.query_builder import Case, Order, JoinType
import json
from raven.api.raven_channel import get_peer_user_id

def track_visit(channel_id, commit=False):
    '''
    Track the last visit of the user to the channel.
    If the user is not a member of the channel, create a new member record
    '''
    doc = frappe.db.get_value("Raven Channel Member", {
        "channel_id": channel_id, "user_id": frappe.session.user}, "name")
    if doc:
        frappe.db.set_value("Raven Channel Member", doc,
                            "last_visit", frappe.utils.now())
    elif frappe.get_cached_value('Raven Channel', channel_id, 'type') == 'Open':
        frappe.get_doc({
            "doctype": "Raven Channel Member",
            "channel_id": channel_id,
            "user_id": frappe.session.user,
            "last_visit": frappe.utils.now()
        }).insert()
    frappe.publish_realtime(
        'raven:unread_channel_count_updated', {
            'channel_id': channel_id,
            'play_sound': False
        }, user=frappe.session.user, after_commit=True)
    # Need to commit the changes to the database if the request is a GET request
    if commit:
        frappe.db.commit()


@frappe.whitelist(methods=['POST'])
def send_message(channel_id, text, is_reply, linked_message=None, json=None):

    # remove empty list items
    clean_text = text.replace('<li><br></li>', '').strip()

    if clean_text:
        if is_reply:
            doc = frappe.get_doc({
                'doctype': 'Raven Message',
                'channel_id': channel_id,
                'text': clean_text,
                'message_type': 'Text',
                'is_reply': is_reply,
                'linked_message': linked_message,
                'json': json
            })
        else:
            doc = frappe.get_doc({
                'doctype': 'Raven Message',
                'channel_id': channel_id,
                'text': clean_text,
                'message_type': 'Text',
                'json': json
            })
        doc.insert()
        return "message sent"


@frappe.whitelist()
def fetch_recent_files(channel_id):
    '''
     Fetches recently sent files in a channel
     Check if the user has permission to view the channel
    '''
    if not frappe.has_permission("Raven Channel", doc=channel_id):
        frappe.throw(
            "You don't have permission to view this channel", frappe.PermissionError)
    files = frappe.db.get_all('Raven Message',
                              filters={
                                  'channel_id': channel_id,
                                  'message_type': ['in', ['Image', 'File']]
                              },
                              fields=['name', 'file', 'owner',
                                      'creation', 'message_type'],
                              order_by='creation desc',
                              limit_page_length=10
                              )

    return files


def get_messages(channel_id):

    messages = frappe.db.get_all('Raven Message',
                                 filters={'channel_id': channel_id},
                                 fields=['name', 'owner', 'creation', 'modified', 'text',
                                         'file', 'message_type', 'message_reactions', 'is_reply', 'linked_message', '_liked_by', 'channel_id', 
                                         'thumbnail_width', 'thumbnail_height', 'file_thumbnail', 'link_doctype', 'link_document',
                                         'replied_message_details', 'content', 'is_edited'],
                                 order_by='creation asc'
                                 )

    return messages


@frappe.whitelist()
def get_saved_messages():
    '''
        Fetches list of all messages liked by the user
        Check if the user has permission to view the message
    '''

    raven_message = frappe.qb.DocType('Raven Message')
    raven_channel = frappe.qb.DocType('Raven Channel')
    raven_channel_member = frappe.qb.DocType('Raven Channel Member')

    query = (frappe.qb.from_(raven_message)
             .join(raven_channel, JoinType.left)
             .on(raven_message.channel_id == raven_channel.name)
             .join(raven_channel_member, JoinType.left)
             .on(raven_channel.name == raven_channel_member.channel_id)
             .select(raven_message.name, raven_message.owner, raven_message.creation, raven_message.text, raven_message.channel_id,
                     raven_message.file, raven_message.message_type, raven_message.message_reactions, raven_message._liked_by)
             .where(raven_message._liked_by.like('%'+frappe.session.user+'%'))
             .where((raven_channel.type.isin(['Open', 'Public'])) | (raven_channel_member.user_id == frappe.session.user))
             .orderby(raven_message.creation, order=Order.asc)
             .distinct())  # Add DISTINCT keyword to retrieve only unique messages

    messages = query.run(as_dict=True)

    return messages


def parse_messages(messages):

    messages_with_date_header = []
    previous_message = None

    for i in range(len(messages)):
        message = messages[i]
        is_continuation = (
            previous_message and
            message['owner'] == previous_message['owner'] and
            (message['creation'] - previous_message['creation']
             ) < timedelta(minutes=2)
        )
        message['is_continuation'] = int(bool(is_continuation))

        if i == 0 or message['creation'].date() != previous_message['creation'].date():
            messages_with_date_header.append({
                'block_type': 'date',
                'data': message['creation'].date()
            })

        messages_with_date_header.append({
            'block_type': 'message',
            'data': message
        })

        previous_message = message

    return messages_with_date_header


def check_permission(channel_id):
    if frappe.get_cached_value('Raven Channel', channel_id, 'type') == 'Private':
        if frappe.db.exists("Raven Channel Member", {"channel_id": channel_id, "user_id": frappe.session.user}):
            pass
        elif frappe.session.user == "Administrator":
            pass
        else:
            frappe.throw(
                "You don't have permission to view this channel", frappe.PermissionError)


@frappe.whitelist()
def get_messages_with_dates(channel_id):
    check_permission(channel_id)
    messages = get_messages(channel_id)
    track_visit(channel_id, True)
    return parse_messages(messages)


@frappe.whitelist()
def get_index_of_message(channel_id, message_id):
    messages = get_messages(channel_id)
    parsed_messages = parse_messages(messages)
    for i in range(len(parsed_messages)):
        if parsed_messages[i]['block_type'] == 'message' and parsed_messages[i]['data']['name'] == message_id:
            return i
    return -1


@frappe.whitelist()
def get_unread_count_for_channels():

    channel = frappe.qb.DocType("Raven Channel")
    channel_member = frappe.qb.DocType("Raven Channel Member")
    message = frappe.qb.DocType('Raven Message')
    query = (frappe.qb.from_(channel)
             .left_join(channel_member)
             .on((channel.name == channel_member.channel_id) & (channel_member.user_id == frappe.session.user))
             .where((channel.type == "Open") | (channel_member.user_id == frappe.session.user))
             .where(channel.is_archived == 0)
             .left_join(message).on(channel.name == message.channel_id))

    channels_query = query.select(channel.name, channel.is_direct_message, Count(Case().when(message.creation > Coalesce(channel_member.last_visit, '2000-11-11'), 1)).as_(
        'unread_count')).groupby(channel.name).run(as_dict=True)

    total_unread_count_in_channels = 0
    total_unread_count_in_dms = 0
    for channel in channels_query:
        if channel.is_direct_message:
            total_unread_count_in_dms += channel['unread_count']
        else:
            total_unread_count_in_channels += channel['unread_count']

    result = {
        'total_unread_count_in_channels': total_unread_count_in_channels,
        'total_unread_count_in_dms': total_unread_count_in_dms,
        'channels': channels_query
    }
    return result


@frappe.whitelist()
def get_timeline_message_content(doctype, docname):

    channel = frappe.qb.DocType("Raven Channel")
    channel_member = frappe.qb.DocType("Raven Channel Member")
    message = frappe.qb.DocType('Raven Message')
    user = frappe.qb.DocType("User")

    query = (frappe.qb.from_(message)
             .select(message.creation, message.owner, message.name, message.text, message.file, channel.name.as_('channel_id'), channel.channel_name, channel.type, channel.is_direct_message, user.full_name, channel.is_self_message)
             .join(channel).on(message.channel_id == channel.name)
             .join(channel_member).on((message.channel_id == channel_member.channel_id) & (message.owner == channel_member.user_id))
             .join(user).on(message.owner == user.name)
             .where((channel.type != "Private") | (channel_member.user_id == frappe.session.user))
             .where(message.link_doctype == doctype)
             .where(message.link_document == docname))
    data = query.run(as_dict=True)

    timeline_contents = []
    for log in data:

        if log.is_direct_message:
            peer_user_id = get_peer_user_id(
                log.channel_id, log.is_direct_message, log.is_self_message)
            if peer_user_id:
                log['peer_user'] = frappe.db.get_value(
                    "User", peer_user_id, "full_name")
        timeline_contents.append({
            "icon": "share",
            "is_card": True,
            "creation": log.creation,
            "template": "send_message",
            "template_data": log
        })

    return timeline_contents

file_extensions = {
        'doc': ['doc', 'docx', 'odt', 'ott', 'rtf', 'txt', 'dot', 'dotx', 'docm', 'dotm', 'pages'],
        'ppt': ['ppt', 'pptx', 'odp', 'otp', 'pps', 'ppsx', 'pot', 'potx', 'pptm', 'ppsm', 'potm', 'ppam', 'ppa', 'key'],
        'xls': ['xls', 'xlsx', 'csv', 'ods', 'ots', 'xlsb', 'xlsm', 'xlt', 'xltx', 'xltm', 'xlam', 'xla', 'numbers'],
}

@frappe.whitelist()
def get_all_files_shared_in_channel(channel_id, file_name=None, file_type=None, start_after=0, page_length=None):

    # check if the user has permission to view the channel
    check_permission(channel_id)

    message = frappe.qb.DocType("Raven Message")
    user = frappe.qb.DocType("Raven User")
    file = frappe.qb.DocType("File")

    query = (frappe.qb.from_(message)
             .join(file).on(message.name == file.attached_to_name)
             .join(user).on(message.owner == user.name)
             .select(file.name, file.file_name, file.file_type, file.file_size, file.file_url,
                     message.owner, message.creation, message.message_type,
                     message.thumbnail_width, message.thumbnail_height, message.file_thumbnail,
                     user.full_name, user.user_image, message.name.as_('message_id'))
             .where(message.channel_id == channel_id)
             )

    # search for file name
    if file_name:
        query = query.where(file.file_name.like("%" + file_name + "%"))

    # search for file type
    if file_type:
        if file_type == 'image':
            query = query.where(message.message_type == 'Image')
        elif file_type == 'pdf':
            query = query.where(file.file_type == 'pdf')
        else:
            # Get the list of extensions for the given file type
            extensions = file_extensions.get(file_type)
            if extensions:
                query = query.where((file.file_type).isin(extensions))
    else:
        query = query.where(message.message_type.isin(['Image', 'File']))

    files = query.orderby(message.creation, order=Order['desc']).limit(
        page_length).offset(start_after).run(as_dict=True)

    return files


@frappe.whitelist()
def get_count_for_pagination_of_files(channel_id, file_name=None, file_type=None):

    # check if the user has permission to view the channel
    check_permission(channel_id)

    message = frappe.qb.DocType("Raven Message")
    # user = frappe.qb.DocType("Raven User")
    file = frappe.qb.DocType("File")

    query = (frappe.qb.from_(message)
             .join(file, JoinType.left)
             .on(message.name == file.attached_to_name)
             .select(Count(message.name).as_('count'))
             .where(message.channel_id == channel_id)
    )

    # search for file name
    if file_name:
        query = query.where(file.file_name.like("%" + file_name + "%"))

    # search for file type
    if file_type:
        if file_type == 'image':
            query = query.where(message.message_type == 'Image')
        elif file_type == 'pdf':
            query = query.where(file.file_type == 'pdf')
        else:
            # Get the list of extensions for the given file type
            extensions = file_extensions.get(file_type)
            if extensions:
                query = query.where((file.file_type).isin(extensions))
    else:
        query = query.where(message.message_type.isin(['Image', 'File']))
    count = query.run(as_dict=True)

    return count[0]['count']
