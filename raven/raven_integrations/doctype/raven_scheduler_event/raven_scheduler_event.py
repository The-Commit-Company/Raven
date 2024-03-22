# Copyright (c) 2024, The Commit Company and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class RavenSchedulerEvent(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		bot: DF.Link
		channel: DF.Link
		content: DF.SmallText
		cron_expression: DF.Data | None
		disabled: DF.Check
		dm: DF.Link
		event_frequency: DF.Literal["Hourly", "Daily", "Weekly", "Monthly", "Yearly", "Hourly Long", "Daily Long", "Weekly Long", "Monthly Long", "Cron"]
		event_name: DF.Data
		scheduler_event_id: DF.Link | None
		send_to: DF.Literal["Channel", "DM"]
	# end: auto-generated types
	pass
