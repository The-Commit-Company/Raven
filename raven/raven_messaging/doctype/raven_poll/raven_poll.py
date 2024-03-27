# Copyright (c) 2024, The Commit Company and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class RavenPoll(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from raven.raven_messaging.doctype.raven_poll_option.raven_poll_option import RavenPollOption

		is_anonymous: DF.Check
		is_disabled: DF.Check
		is_multi_choice: DF.Check
		options: DF.Table[RavenPollOption]
		question: DF.SmallText
	# end: auto-generated types

	def on_trash(self):
		# Delete all poll votes
		frappe.db.delete("Raven Poll Vote", {"poll_id": self.name})

	pass
