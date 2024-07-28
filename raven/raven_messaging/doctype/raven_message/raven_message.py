# Copyright (c) 2023, The Commit Company and contributors
# For license information, please see license.txt
import datetime
import json

import frappe
from frappe import _
from frappe.core.utils import html2text
from frappe.model.document import Document
from frappe.utils import get_datetime, get_system_timezone
from pytz import timezone, utc

from raven.notification import send_notification_to_topic, send_notification_to_user
from raven.utils import track_channel_visit


class RavenMessage(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from raven.raven_messaging.doctype.raven_mention.raven_mention import RavenMention

		bot: DF.Link | None
		channel_id: DF.Link
		content: DF.LongText | None
		file: DF.Attach | None
		file_thumbnail: DF.Attach | None
		hide_link_preview: DF.Check
		image_height: DF.Data | None
		image_width: DF.Data | None
		is_bot_message: DF.Check
		is_edited: DF.Check
		is_forwarded: DF.Check
		is_reply: DF.Check
		json: DF.JSON | None
		link_doctype: DF.Link | None
		link_document: DF.DynamicLink | None
		linked_message: DF.Link | None
		mentions: DF.Table[RavenMention]
		message_reactions: DF.JSON | None
		message_type: DF.Literal["Text", "Image", "File", "Poll"]
		poll_id: DF.Link | None
		replied_message_details: DF.JSON | None
		text: DF.LongText | None
		thumbnail_height: DF.Data | None
		thumbnail_width: DF.Data | None
	# end: auto-generated types

	def before_validate(self):
		try:
			if self.text:
				content = html2text(self.text)
				# Remove trailing new line characters and white spaces
				self.content = content.rstrip()
		except Exception:
			pass

		if not self.is_new():
			# this is not a new message, so it's a previous message being edited
			old_doc = self.get_doc_before_save()
			if old_doc.text != self.text:
				self.is_edited = True

		self.process_mentions()

	def validate(self):
		"""
		1. If there is a linked message, the linked message should be in the same channel
		"""
		self.validate_linked_message()
		"""
		2. If the message is of type Poll, the poll_id should be set
		"""
		self.validate_poll_id()

	def validate_linked_message(self):
		"""
		If there is a linked message, the linked message should be in the same channel
		"""
		if self.linked_message:
			if (
				frappe.get_cached_value("Raven Message", self.linked_message, "channel_id") != self.channel_id
			):
				frappe.throw(_("Linked message should be in the same channel"))

	def validate_poll_id(self):
		"""
		If the message is of type Poll, the poll_id should be set
		"""
		if self.message_type == "Poll" and not self.poll_id:
			frappe.throw(_("Poll ID is mandatory for a poll message"))

	def before_insert(self):
		"""
		If the message is a reply, update the replied_message_details field
		"""
		if self.is_reply and self.linked_message:
			details = frappe.db.get_value(
				"Raven Message",
				self.linked_message,
				["text", "content", "file", "message_type", "owner", "creation"],
				as_dict=True,
			)
			self.replied_message_details = {
				"text": details.text,
				"content": details.content,
				"file": details.file,
				"message_type": details.message_type,
				"owner": details.owner,
				"creation": datetime.datetime.strftime(details.creation, "%Y-%m-%d %H:%M:%S"),
			}

	def after_insert(self):
		# TODO: Enqueue this
		self.publish_unread_count_event()

	def publish_unread_count_event(self):
		frappe.db.set_value(
			"Raven Channel", self.channel_id, "last_message_timestamp", self.creation, update_modified=False
		)
		frappe.db.set_value(
			"Raven Channel",
			self.channel_id,
			"last_message_details",
			json.dumps(
				{
					"message_id": self.name,
					"content": self.content if self.message_type == "Text" else self.file,
					"message_type": self.message_type,
					"owner": self.owner,
					"is_bot_message": self.is_bot_message,
					"bot": self.bot,
				}
			),
		)

		channel_doc = frappe.get_cached_doc("Raven Channel", self.channel_id)
		# If the message is a direct message, then we can only send it to one user
		if channel_doc.is_direct_message:

			if not channel_doc.is_self_message:

				peer_raven_user = frappe.db.get_value(
					"Raven Channel Member",
					{"channel_id": self.channel_id, "user_id": ("!=", frappe.session.user)},
					"user_id",
				)
				peer_user_id = frappe.get_cached_value("Raven User", peer_raven_user, "user")

				frappe.publish_realtime(
					"raven:unread_channel_count_updated",
					{
						"channel_id": self.channel_id,
						"play_sound": True,
						"sent_by": self.owner,
					},
					user=peer_user_id,
					after_commit=True,
				)

			# Need to send this to sender as well since they need to update the last message timestamp
			frappe.publish_realtime(
				"raven:unread_channel_count_updated",
				{
					"channel_id": self.channel_id,
					"play_sound": False,
					"sent_by": self.owner,
				},
				user=self.owner,
				after_commit=True,
			)
		else:
			# This event needs to be published to all users on Raven (desk + website)
			frappe.publish_realtime(
				"raven:unread_channel_count_updated",
				{
					"channel_id": self.channel_id,
					"play_sound": False,
					"sent_by": self.owner,
				},
				after_commit=True,
				room="website",
			)

	def process_mentions(self):
		if not self.json:
			return

		try:
			content = self.json.get("content", [{}])[0].get("content", [])
		except (IndexError, AttributeError):
			return

		entered_ids = set()
		for item in content:
			if item.get("type") == "userMention":
				user_id = item.get("attrs", {}).get("id")
				if user_id and user_id not in entered_ids:
					self.append("mentions", {"user": user_id})
					entered_ids.add(user_id)

	def send_push_notification(self):
		# TODO: Send Push Notification for the following:
		# 1. If the message is a direct message, send a push notification to the other user
		# 2. If the message has mentions, send a push notification to the mentioned users if they belong to the channel
		# 3. If the message is a reply, send a push notification to the user who is being replied to
		# 4. If the message is in a channel, send a push notification to all the users in the channel (topic)

		channel_doc = frappe.get_cached_doc("Raven Channel", self.channel_id)

		if channel_doc.is_direct_message:
			if not channel_doc.is_self_message:
				# The message was sent on a direct message channel
				self.send_notification_for_direct_message()
		else:
			# The message was sent on a channel
			self.send_notification_for_channel_message()
			# channel_type = frappe.get_cached_value("Raven Channel", self.channel_id, "channel_type")

	def get_notification_message_content(self):
		"""
		Gets the content of the message for the push notification
		"""
		if self.message_type == "File":
			file_name = self.file.split("/")[-1]
			return f"📄 Sent a file - {file_name}"
		elif self.message_type == "Image":
			return "📷 Sent a photo"
		elif self.message_type == "Poll":
			return "📊 Sent a poll"
		elif self.text:
			# Check if the message is a GIF
			if "<img src=https://media.tenor.com" in self.text:
				return "Sent a GIF"
			else:
				return self.text

	def get_message_owner_name(self):
		"""
		Get the full name of the message owner
		"""
		if self.is_bot_message:
			return frappe.get_cached_value("Raven User", self.bot, "full_name")
		else:
			return frappe.get_cached_value("Raven User", self.owner, "full_name")

	def send_notification_for_direct_message(self):
		"""
		The message is sent on a DM channel. Get the other user in the channel and send a push notification
		"""
		peer_raven_user = frappe.db.get_value(
			"Raven Channel Member",
			{"channel_id": self.channel_id, "user_id": ("!=", self.owner)},
			"user_id",
		)

		if not peer_raven_user:
			return

		message = self.get_notification_message_content()

		owner_name = self.get_message_owner_name()

		send_notification_to_user(
			user_id=peer_raven_user,
			user_image_id=self.owner,
			title=owner_name,
			message=message,
			data={
				"message_id": self.name,
				"channel_id": self.channel_id,
				"raven_message_type": self.message_type,
				"channel_type": "DM",
				"content": self.content if self.message_type == "Text" else self.file,
				"from_user": self.owner,
				"type": "New message",
				"creation": get_milliseconds_since_epoch(self.creation),
			},
		)

	def send_notification_for_channel_message(self):
		"""
		The message was sent on a channel. Send a push notification to all the users in the channel (topic)
		"""
		message = self.get_notification_message_content()

		channel_name = frappe.get_cached_value("Raven Channel", self.channel_id, "channel_name")

		owner_name = self.get_message_owner_name()
		title = f"{owner_name} in #{channel_name}"

		send_notification_to_topic(
			channel_id=self.channel_id,
			user_image_id=self.owner,
			title=title,
			message=message,
			data={
				"message_id": self.name,
				"channel_id": self.channel_id,
				"raven_message_type": self.message_type,
				"channel_type": "Channel",
				"content": self.content if self.message_type == "Text" else self.file,
				"from_user": self.owner,
				"type": "New message",
				"creation": get_milliseconds_since_epoch(self.creation),
			},
		)

	def send_notification_for_mentions(self, user):
		try:
			from frappe.push_notification import PushNotification

			push_notification = PushNotification("raven")

			if push_notification.is_enabled():
				push_notification.send_notification_to_user(
					user,
					"You were mentioned",
					self.content
					# icon=f"{frappe.utils.get_url()}/assets/hrms/manifest/favicon-196.png",
				)
		except ImportError:
			# push notifications are not supported in the current framework version
			pass
		except Exception:
			frappe.log_error(frappe.get_traceback())

	def after_delete(self):
		frappe.publish_realtime(
			"message_deleted",
			{
				"channel_id": self.channel_id,
				"sender": frappe.session.user,
				"message_id": self.name,
			},
			doctype="Raven Channel",
			# Adding this to automatically add the room for the event via Frappe
			docname=self.channel_id,
		)

		self.publish_unread_count_event()

		# delete poll if the message is of type poll after deleting the message
		if self.message_type == "Poll":
			frappe.delete_doc("Raven Poll", self.poll_id)

		# TEMP: this is a temp fix for the Desk interface
		self.publish_deprecated_event_for_desk()

	def publish_deprecated_event_for_desk(self):
		# TEMP: this is a temp fix for the Desk interface
		frappe.publish_realtime(
			"message_updated",
			{
				"channel_id": self.channel_id,
				"sender": frappe.session.user,
				"message_id": self.name,
			},
			doctype="Raven Channel",
			docname=self.channel_id,
			after_commit=True,
		)

	def on_update(self):

		# TEMP: this is a temp fix for the Desk interface
		self.publish_deprecated_event_for_desk()

		if self.is_edited:
			frappe.publish_realtime(
				"message_edited",
				{
					"channel_id": self.channel_id,
					"sender": frappe.session.user,
					"message_id": self.name,
					"message_details": {
						"text": self.text,
						"content": self.content,
						"file": self.file,
						"poll_id": self.poll_id,
						"message_type": self.message_type,
						"is_edited": 1 if self.is_edited else 0,
						"is_forwarded": self.is_forwarded,
						"is_reply": self.is_reply,
						"modified": self.modified,
						"linked_message": self.linked_message,
						"replied_message_details": self.replied_message_details,
						"link_doctype": self.link_doctype,
						"link_document": self.link_document,
						"message_reactions": self.message_reactions,
						"is_bot_message": self.is_bot_message,
						"bot": self.bot,
						"hide_link_preview": self.hide_link_preview,
					},
				},
				doctype="Raven Channel",
				# Adding this to automatically add the room for the event via Frappe
				docname=self.channel_id,
			)
		else:
			after_commit = False
			if self.message_type == "File" or self.message_type == "Image":
				# If the message is a file or an image, then we need to wait for the file to be uploaded
				after_commit = True
				if not self.file:
					return

			if self.message_type == "Poll":
				# If the message is a poll, then we need to wait for the poll to be created
				after_commit = True

			frappe.publish_realtime(
				"message_created",
				{
					"channel_id": self.channel_id,
					"sender": frappe.session.user,
					"message_id": self.name,
					"message_details": {
						"text": self.text,
						"content": self.content,
						"file": self.file,
						"message_type": self.message_type,
						"is_edited": 1 if self.is_edited else 0,
						"is_forwarded": self.is_forwarded,
						"is_reply": self.is_reply,
						"poll_id": self.poll_id,
						"creation": self.creation,
						"owner": self.owner,
						"modified_by": self.modified_by,
						"modified": self.modified,
						"linked_message": self.linked_message,
						"replied_message_details": self.replied_message_details,
						"link_doctype": self.link_doctype,
						"link_document": self.link_document,
						"message_reactions": self.message_reactions,
						"thumbnail_width": self.thumbnail_width,
						"thumbnail_height": self.thumbnail_height,
						"file_thumbnail": self.file_thumbnail,
						"image_width": self.image_width,
						"image_height": self.image_height,
						"name": self.name,
						"is_bot_message": self.is_bot_message,
						"bot": self.bot,
						"hide_link_preview": self.hide_link_preview,
					},
				},
				doctype="Raven Channel",
				# Adding this to automatically add the room for the event via Frappe
				docname=self.channel_id,
				after_commit=after_commit,
			)
			# track the visit of the user to the channel if a new message is created
			frappe.enqueue(method=track_channel_visit, channel_id=self.channel_id, user=self.owner)

			self.send_push_notification()

	def on_trash(self):
		# delete all the reactions for the message
		frappe.db.delete("Raven Message Reaction", {"message": self.name})


def on_doctype_update():
	"""
	Add indexes to Raven Message table
	"""
	# Index the selector (channel or message type) first for faster queries (less rows to sort in the next step)
	frappe.db.add_index("Raven Message", ["channel_id", "creation"])
	frappe.db.add_index("Raven Message", ["message_type", "creation"])


def get_milliseconds_since_epoch(timestamp: str) -> str:
	"""
	Returns the milliseconds since epoch for a given timestamp
	"""
	datetime_obj = get_datetime(timestamp)

	# Localize the datetime object to system timezone
	time_zone = get_system_timezone()
	system_datetime = timezone(time_zone).localize(datetime_obj)

	# Convert the system datetime to UTC
	utc_datetime = system_datetime.astimezone(utc)

	# Get the timestamp in milliseconds since epoch for the UTC datetime
	seconds_since_epoch = utc_datetime.timestamp()
	return str(seconds_since_epoch * 1000)
