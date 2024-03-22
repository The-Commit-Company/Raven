# Copyright (c) 2024, The Commit Company and contributors
# For license information, please see license.txt

import frappe
from frappe.modules.export_file import export_to_files
from frappe.model.document import Document


class RavenBot(Document):
    def on_update(self):
        if frappe.conf.developer_mode and self.is_standard:
            export_to_files(
                record_list=[["Raven Bot", self.name]], record_module=self.module
            )
