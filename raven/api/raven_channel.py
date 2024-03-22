import frappe
from frappe import _
from frappe.model.document import Document

@frappe.whitelist()
def get_all_channels(hide_archived=True):
    '''
        Fetches all channels where current user is a member - both channels and DMs
        To be used on the web app. 
        On mobile app, these are separate lists
    '''

    # 1. Get "channels" - public, open, private, and DMs
    channels = get_channel_list(hide_archived)

    # 3. For every channel, we need to fetch the peer's User ID (if it's a DM)
    parsed_channels = []
    for channel in channels:
        parsed_channel = {
            **channel,
            "peer_user_id": get_peer_user_id(channel.get('name'), channel.get('is_direct_message'), channel.get('is_self_message')),
        }

        parsed_channels.append(parsed_channel)

    channel_list = [
        channel for channel in parsed_channels if not channel.get('is_direct_message')]
    dm_list = [channel for channel in parsed_channels if channel.get(
        'is_direct_message')]

    # Get extra users if dm channels length is less than 5
    extra_users = []
    number_of_dms = len(dm_list)

    if number_of_dms < 5:
        extra_users = get_extra_users(dm_list)

    return {
        "channels": channel_list,
        "dm_channels": dm_list,
        "extra_users": extra_users
    }


def get_channel_list(hide_archived=False):
    # get List of all channels where current user is a member (all includes public, private, open, and DM channels)
    channel = frappe.qb.DocType("Raven Channel")
    channel_member = frappe.qb.DocType("Raven Channel Member")
    query = (frappe.qb.from_(channel)
             .select(channel.name, channel.channel_name, channel.type, channel.channel_description, channel.is_archived, channel.is_direct_message, channel.is_self_message, channel.creation, channel.owner).distinct()
             .left_join(channel_member)
             .on((channel.name == channel_member.channel_id))
             .where((channel.type != "Private") | (channel_member.user_id == frappe.session.user)))

    if hide_archived:
        query = query.where(channel.is_archived == 0)

    return query.run(as_dict=True)


@frappe.whitelist()
def get_channels(hide_archived=False):
    channels = get_channel_list(hide_archived)
    for channel in channels:
        peer_user_id = get_peer_user_id(channel.get('name'), channel.get(
            'is_direct_message'), channel.get('is_self_message'))
        channel['peer_user_id'] = peer_user_id
        if peer_user_id:
            user_full_name = frappe.get_cached_value(
                'User', peer_user_id, 'full_name')
            channel['full_name'] = user_full_name
    return channels


def get_peer_user_id(channel_id, is_direct_message, is_self_message=False):
    '''
    For a given channel, fetches the user id of the peer
    '''
    if is_direct_message == 0:
        return None
    if is_self_message:
        return frappe.session.user
    return frappe.db.get_value('Raven Channel Member', {
        'channel_id': channel_id,
        'user_id': ['!=', frappe.session.user]
    }, 'user_id')


def get_extra_users(dm_channels):
    '''
    Fetch extra users - only when number of DMs is less than 5.
    Do not repeat users already in the list
    '''
    existing_users = [dm_channel.get('peer_user_id')
                      for dm_channel in dm_channels]
    existing_users.append('Administrator')
    existing_users.append('Guest')

    # Skip permissions since we are only fetching user_id, full_name, and user_image and have applied filters
    return frappe.db.get_all('User', filters=[
        ['name', 'not in', existing_users],
        ['enabled', '=', 1],
        ["Has Role", "role", "=", 'Raven User']], fields=['name', 'full_name', 'user_image'])


@frappe.whitelist(methods=['POST'])
def create_direct_message_channel(user_id):
    '''
        Creates a direct message channel between current user and the user with user_id
        The user_id can be the peer or the user themself
        1. Check if a channel already exists between the two users
        2. If not, create a new channel
        3. Check if the user_id is the current user and set is_self_message accordingly
    '''
    # TODO: this logic might break if the user_id changes
    channel_name = frappe.db.get_value("Raven Channel", filters={
        "is_direct_message": 1,
        "channel_name": ["in", [frappe.session.user + " _ " + user_id, user_id + " _ " + frappe.session.user]]
    }, fieldname="name")
    if channel_name:
        return channel_name
    # create direct message channel with user and current user
    else:
        channel = frappe.get_doc({
            "doctype": "Raven Channel",
            "channel_name": frappe.session.user + " _ " + user_id,
            "is_direct_message": 1,
            "is_self_message": frappe.session.user == user_id
        })
        channel.insert()
        if frappe.session.user != user_id:
            channel.add_members([user_id], 1)
        return channel.name
