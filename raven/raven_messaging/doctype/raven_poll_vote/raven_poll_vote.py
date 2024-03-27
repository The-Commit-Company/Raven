# Copyright (c) 2024, The Commit Company and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class RavenPollVote(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		option: DF.Data
		poll_id: DF.Link
		user_id: DF.Link
	# end: auto-generated types

	def after_insert(self):
		update_poll_votes(self.poll_id)

	def after_delete(self):
		update_poll_votes(self.poll_id)


def update_poll_votes(poll_id):
	poll = frappe.get_cached_doc("Raven Poll", poll_id)
	# get votes for each option
	poll_votes = frappe.get_all(
		"Raven Poll Vote",
		filters={"poll_id": poll_id},
		fields=["option", "count(name) as votes"],
		group_by="option",
	)

	# update the votes for each option in the poll
	for vote in poll_votes:
		for option in poll.options:
			if option.name == vote.option:
				option.votes = vote.votes
				break

	poll.save()
