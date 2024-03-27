import frappe


def channel_has_permission(doc, user=None, ptype=None):

	if doc.type == "Open" or doc.type == "Public":
		return True
	elif doc.type == "Private":
		if frappe.db.exists("Raven Channel Member", {"channel_id": doc.name, "user_id": user}):
			return True
		elif (
			doc.owner == user and frappe.db.count("Raven Channel Member", {"channel_id": doc.name}) <= 0
		):
			return True
		elif user == "Administrator":
			return True
		else:
			return False


def channel_member_has_permission(doc, user=None, ptype=None):

	# Allow self to modify their own channel member document
	if doc.user_id == user:
		return True

	channel_type = frappe.get_cached_value("Raven Channel", doc.channel_id, "type")

	if channel_type == "Open" or channel_type == "Public":
		return True

	if channel_type == "Private":
		# If it's a private channel, only the members can modify the channel member
		if frappe.db.exists("Raven Channel Member", {"channel_id": doc.channel_id, "user_id": user}):
			return True
		elif user == "Administrator":
			return True
		else:
			return False


def message_has_permission(doc, user=None, ptype=None):

	channel_type = frappe.get_cached_value("Raven Channel", doc.channel_id, "type")

	# If the channel is open, a user can post a message.
	# For creating or deleting a message, the permission check is added in the validate method of Raven Message
	if channel_type == "Open":
		if ptype == "read":
			return True
		else:
			return doc.owner == user

	# If the channel is public, a user can read a message.
	if channel_type == "Public":
		if ptype == "read":
			return True

	if frappe.db.exists("Raven Channel Member", {"channel_id": doc.channel_id, "user_id": user}):
		if ptype == "read":
			return True
		else:
			return doc.owner == user
	elif user == "Administrator":
		return True
	else:
		return False


def raven_poll_vote_has_permission(doc, user=None, ptype=None):

	if not user:
		user = frappe.session.user
	
	"""
		Check if user has access to the channel where the poll message is posted
		Allowed users can add a vote to a poll and read votes (if the poll is not anonymous)
	"""
	
	raven_message = frappe.get_all("Raven Message", filters={"poll_id": doc.poll_id}, fields=["channel_id"])
	if raven_message:
		channel_id = raven_message[0].channel_id
		channel_has_permission(frappe.get_doc("Raven Channel", channel_id), user, ptype)

		if ptype in ["read", "create"]:
			if doc.owner == user:
				return True
			elif user == "Administrator":
				return True
			else:
				is_anonymous = frappe.get_cached_value("Raven Poll", doc.poll_id, "is_anonymous")
				if not is_anonymous:
					if ptype == "read":
						return True

	return False

def raven_poll_has_permission(doc, user=None, ptype=None):

	if not user:
		user = frappe.session.user
	
	"""
		Check if user has access to the channel where the poll message is posted
		Allowed users can create a poll and read polls. 
		Only the poll creator can delete the poll
	"""

	raven_message = frappe.get_all("Raven Message", filters={"poll_id": doc.name}, fields=["channel_id"])
	if raven_message:
		channel_id = raven_message[0].channel_id
		channel_has_permission(frappe.get_doc("Raven Channel", channel_id), user, ptype)

		if ptype in ["read", "create", "delete"]:
			if doc.owner == user:
				return True
			elif user == "Administrator":
				return True
			else:
				if ptype == "read":
					return True

	return False


def raven_channel_query(user):
	if not user:
		user = frappe.session.user

	"""
      Only show channels that the user is a owner of

      We could also remove "Raven User" from the Raven Channel doctype role, but then permission checks for joining socket rooms for the channel would fail

      Hence, we are adding a WHERE clause to the query - this is inconsequential since we will never use the standard get_list query for Raven Channel,
      but needed for security since we do not want users to be able to view channels they are not a member of
    """
	return f"`tabRaven Channel`.owner = {frappe.db.escape(user)}"


def raven_message_query(user):
	if not user:
		user = frappe.session.user

	"""
      Only show messages created by the user using a WHERE clause

      We could also remove "Raven User" from the Raven Message doctype role, but then permission checks for attached files would also fail.

      Hence, we are adding a WHERE clause to the query - this is inconsequential since we will never use the standard get_list query for Raven Message,
      but needed for security since we do not want users to be able to view messages from channels they are not a member of
    """
	return f"`tabRaven Message`.owner = {frappe.db.escape(user)}"
