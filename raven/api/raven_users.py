import json

import frappe
from frappe import _


@frappe.whitelist()
def get_list():
	"""
	Fetches list of all users who have the role: Raven User
	"""

	# Check if the user is a Raven User and has he "Raven User" role
	# If not, then throw an error
	if "Raven User" not in frappe.get_roles():
		frappe.throw(
			_(
				"You do not have a <b>Raven User</b> role. Please contact your administrator to add your user profile as a <b>Raven User</b>."
			),
			title=_("Insufficient permissions. Please contact your administrator."),
		)

	if not frappe.db.exists("Raven User", {"user": frappe.session.user}):
		frappe.throw(
			_(
				"You do not have a <b>Raven User</b> profile. Please contact your administrator to add your user profile as a <b>Raven User</b>."
			),
			title=_("Insufficient permissions. Please contact your administrator."),
		)

	users = frappe.db.get_all(
		"Raven User",
		fields=["full_name", "user_image", "name", "first_name", "enabled"],
		order_by="full_name",
	)
	return users


@frappe.whitelist(methods=["POST"])
def add_users_to_raven(users):

	if isinstance(users, str):
		users = json.loads(users)

	failed_users = []
	success_users = []

	for user in users:
		user_doc = frappe.get_doc("User", user)

		if user_doc.role_profile_name:
			failed_users.append(user_doc)

		elif hasattr(user_doc, "role_profiles") and len(user_doc.role_profiles) > 0:
			failed_users.append(user_doc)
		else:
			user_doc.append("roles", {"role": "Raven User"})
			user_doc.save()
			success_users.append(user_doc)

	return {"success_users": success_users, "failed_users": failed_users}
