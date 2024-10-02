// Copyright (c) 2024, bizmap and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Raven Notification", {
// 	refresh(frm) {

// 	},
// });
// Copyright (c) 2018, Frappe Technologies and contributors
// For license information, please see license.txt

const DATE_BASED_EVENTS = ["Days Before", "Days After"];

frappe.notification = {
	setup_fieldname_select: function (frm) {
		// get the doctype to update fields
		if (!frm.doc.document_type) {
			return;
		}

		frappe.model.with_doctype(frm.doc.document_type, function () {
			let get_select_options = function (df, parent_field) {
				// Append parent_field name along with fieldname for child table fields
				let select_value = parent_field ? df.fieldname + "," + parent_field : df.fieldname;

				return {
					value: select_value,
					label: df.fieldname + " (" + __(df.label, null, df.parent) + ")",
				};
			};

			let get_date_change_options = function () {
				let date_options = $.map(fields, function (d) {
					return d.fieldtype == "Date" || d.fieldtype == "Datetime"
						? get_select_options(d)
						: null;
				});
				// append creation and modified date to Date Change field
				return date_options.concat([
					{ value: "creation", label: `creation (${__("Created On")})` },
					{ value: "modified", label: `modified (${__("Last Modified Date")})` },
				]);
			};

			let fields = frappe.get_doc("DocType", frm.doc.document_type).fields;
			let options = $.map(fields, function (d) {
				return frappe.model.no_value_type.includes(d.fieldtype)
					? null
					: get_select_options(d);
			});

			// set value changed options
			frm.set_df_property("value_changed", "options", [""].concat(options));
			frm.set_df_property("set_property_after_alert", "options", [""].concat(options));

			// set date changed options
			frm.set_df_property("date_changed", "options", get_date_change_options());

			let receiver_fields = [];
			if (frm.doc.channel === "Email") {
				receiver_fields = $.map(fields, function (d) {
					// Add User and Email fields from child into select dropdown
					if (frappe.model.table_fields.includes(d.fieldtype)) {
						let child_fields = frappe.get_doc("DocType", d.options).fields;
						return $.map(child_fields, function (df) {
							return df.options == "Email" ||
								(df.options == "User" && df.fieldtype == "Link")
								? get_select_options(df, d.fieldname)
								: null;
						});
						// Add User and Email fields from parent into select dropdown
					} else {
						return d.options == "Email" ||
							(d.options == "User" && d.fieldtype == "Link")
							? get_select_options(d)
							: null;
					}
				});
			} else if (["WhatsApp", "SMS"].includes(frm.doc.channel)) {
				receiver_fields = $.map(fields, function (d) {
					return d.options == "Phone" ? get_select_options(d) : null;
				});
			}

			// set email recipient options
			frm.fields_dict.recipients.grid.update_docfield_property(
				"receiver_by_document_field",
				"options",
				[""].concat(["owner"]).concat(receiver_fields)
			);
		});
	},
	setup_example_message: function (frm) {
		let template = "";
		if (frm.doc.channel === "Email") {
			template = `<h5>Message Example</h5>

<pre>&lt;h3&gt;Order Overdue&lt;/h3&gt;

&lt;p&gt;Transaction {{ doc.name }} has exceeded Due Date. Please take necessary action.&lt;/p&gt;

&lt;!-- show last comment --&gt;
{% if comments %}
Last comment: {{ comments[-1].comment }} by {{ comments[-1].by }}
{% endif %}

&lt;h4&gt;Details&lt;/h4&gt;

&lt;ul&gt;
&lt;li&gt;Customer: {{ doc.customer }}
&lt;li&gt;Amount: {{ doc.grand_total }}
&lt;/ul&gt;
</pre>
			`;
		} else if (["Slack", "System Notification", "SMS"].includes(frm.doc.channel)) {
			template = `<h5>Message Example</h5>

<pre>*Order Overdue*

Transaction {{ doc.name }} has exceeded Due Date. Please take necessary action.

<!-- show last comment -->
{% if comments %}
Last comment: {{ comments[-1].comment }} by {{ comments[-1].by }}
{% endif %}

*Details*

• Customer: {{ doc.customer }}
• Amount: {{ doc.grand_total }}
</pre>`;
		}
		if (template) {
			frm.set_df_property("message_examples", "options", template);
		}
	},
};

frappe.ui.form.on("Raven Notification", {
	onload: function (frm) {
		frm.set_query("document_type", function () {
			if (DATE_BASED_EVENTS.includes(frm.doc.event)) return;

			return {
				filters: {
					istable: 0,
				},
			};
		});
		
	},
	refresh: function (frm) {
		frappe.notification.setup_fieldname_select(frm);
		frappe.notification.setup_example_message(frm);

		frm.add_fetch("sender", "email_id", "sender_email");
		frm.set_query("sender", () => {
			return {
				filters: {
					enable_outgoing: 1,
				},
			};
		});
		frm.get_field("is_standard").toggle(frappe.boot.developer_mode);
		frm.trigger("event");
	},
	document_type: function (frm) {
		frappe.notification.setup_fieldname_select(frm);
	},
	view_properties: function (frm) {
		frappe.route_options = { doc_type: frm.doc.document_type };
		frappe.set_route("Form", "Customize Form");
	},
	event: function (frm) {
		if (!DATE_BASED_EVENTS.includes(frm.doc.event) || frm.is_new()) return;

		frm.add_custom_button(__("Get Alerts for Today"), function () {
			frappe.call({
				method: "frappe.email.doctype.raven_notification.raven_notification.get_documents_for_today",
				args: {
					notification: frm.doc.name,
				},
				callback: function (r) {
					if (r.message && r.message.length > 0) {
						frappe.msgprint(r.message.toString());
					} else {
						frappe.msgprint(__("No alerts for today"));
					}
				},
			});
		});
	},
	channel: function (frm) {
		frm.toggle_reqd("recipients", frm.doc.channel == "Email");
		frappe.notification.setup_fieldname_select(frm);
		frappe.notification.setup_example_message(frm);
		if (frm.doc.channel === "SMS" && frm.doc.__islocal) {
			frm.set_df_property(
				"channel",
				"description",
				`To use SMS Channel, initialize <a href="/app/sms-settings">SMS Settings</a>.`
			);
		} else {
			frm.set_df_property("channel", "description", ` `);
		}
	},
});


frappe.ui.form.on("Raven Notification", {
	refresh: function(frm) {
	
	var doctype = frm.doc.document_type.toString().toLowerCase().replace(' ', '-');
		
	var link = frappe.urllib.get_full_url(`/app/${doctype}/`);
	
	},
	channel:function(frm){
		if (frm.doc.channel ==  'Channel'){
			frm.clear_table("dm");
		}
		frm.refresh_field("dm")
		if (frm.doc.channel == 'DM'){
			frm.clear_table("raven_channel");
		}
		frm.refresh_field("raven_channel")
	},
	validate: function(frm) {
		var doctype = frm.doc.document_type.toString().toLowerCase().replace(' ', '-');
		
		var link = frappe.urllib.get_full_url(`/app/${doctype}/`);
		frm.doc.link = link;
		cur_frm.refresh_field("link")
		
		
		

	},
	
	
	get_fields: function (frm) {
		if (frm.doc.document_type) {
			frappe.model.with_doctype(frm.doc.document_type, function() {
				var fields = frappe.meta.get_docfields(frm.doc.document_type);
				var field_options = [];
				var existing_json = frm.doc.json ? JSON.parse(frm.doc.json) : {doctype_fields: {}, child_table_fields: {}};
				
				field_options.push({
					'fieldname': 'doctype_name',
					'label': frm.doc.document_type,
					'fieldtype': 'HTML',
					'options': `<h3>${frm.doc.document_type}</h3>`
				});
	
				var main_fields = [];
				var child_table_fields_map = {};
				var selected_child_tables = [];
	
				fields.forEach(function(field) {
					if (field.fieldtype !== 'Table' && field.label) {
						main_fields.push({
							'fieldname': 'doctype_name_' + field.fieldname,
							'label': __(field.label),
							'fieldtype': 'Check',
							'default': existing_json.doctype_fields[field.fieldname] || 0
						});
					} else if (field.fieldtype === 'Table') {
						if (!child_table_fields_map[field.fieldname]) {
							child_table_fields_map[field.fieldname] = {
								label: field.label,
								options: field.options,
								fields: []
							};
						}
					}
				});
	
				if (main_fields.length > 1) {
					var halfway_index = Math.ceil(main_fields.length / 2);
					main_fields.splice(halfway_index, 0, {
						'fieldtype': 'Column Break'
					});
				}
	
				field_options = field_options.concat(main_fields);
	
				field_options.push({
					'fieldtype': 'Section Break'
				});
	
				var child_table_promises = Object.keys(child_table_fields_map).map(function(table_fieldname) {
					return new Promise(function(resolve) {
						var table_info = child_table_fields_map[table_fieldname];
						frappe.model.with_doctype(table_info.options, function() {
							var child_fields = frappe.meta.get_docfields(table_info.options);
	
							var child_table_fields = [{
								'fieldname': table_fieldname + '_heading',
								'label': table_info.label,
								'fieldtype': 'HTML',
								'options': `<h4>${table_info.label}</h4>`
							}];
	
							child_fields.forEach(function(child_field) {
								if (child_field.label) {
									child_table_fields.push({
										'fieldname': table_fieldname + '_' + child_field.fieldname,
										'label': __(child_field.label),
										'fieldtype': 'Check',
										'default': existing_json.child_table_fields[table_fieldname] && existing_json.child_table_fields[table_fieldname][child_field.fieldname] || 0,
										'onchange': function() {
											// Add or remove the child table from selected_child_tables based on selection
											if (this.get_value()) {
												selected_child_tables.push({ table: table_fieldname, field: child_field.fieldname });
											} else {
												selected_child_tables = selected_child_tables.filter(item => !(item.table === table_fieldname && item.field === child_field.fieldname));
											}
										}
									});
								}
							});
	
							if (child_table_fields.length > 1) {
								var halfway_index = Math.ceil(child_table_fields.length / 2);
								child_table_fields.splice(halfway_index, 0, {
									'fieldtype': 'Column Break'
								});
							}
	
							child_table_fields.push({
								'fieldtype': 'Section Break'
							});
	
							resolve(child_table_fields);
						});
					});
				});
	
				Promise.all(child_table_promises).then(function(child_table_fields_arrays) {
					child_table_fields_arrays.forEach(function(child_table_fields) {
						field_options = field_options.concat(child_table_fields);
					});
	
					var dialog = new frappe.ui.Dialog({
						title: __('Select Fields'),
						fields: field_options,
						primary_action_label: __('Add'),
						size: 'large',
						primary_action: function() {
							var selected_fields = dialog.get_values();
							var custom_json = {
								doctype_fields: {},
								child_table_fields: {}
							};
	
							// Capture fields from the main doctype
							for (var key in selected_fields) {
								if (selected_fields[key] && key.startsWith('doctype_name_')) {
									custom_json.doctype_fields[key.replace('doctype_name_', '')] = selected_fields[key];
								}
							}
	
							// Capture child table fields in the order of selection
							selected_child_tables.forEach(function(item) {
								if (!custom_json.child_table_fields[item.table]) {
									custom_json.child_table_fields[item.table] = {};
								}
								custom_json.child_table_fields[item.table][item.field] = 1;
							});
	
							frm.set_value('json', JSON.stringify(custom_json));
							frm.refresh_field('json');
	
							dialog.hide();
						}
					});
	
					dialog.show();
				});
			});
		} else {
			frappe.msgprint(__('Please select a Document Type first'));
		}
	}
	
	
	
	

})