# Copyright (c) 2024, bizmap and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from frappe import _

import json
from markupsafe import Markup
from datetime import date


class RavenNotification(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.email.doctype.notification_recipient.notification_recipient import NotificationRecipient
		from frappe.types import DF
		from raven.raven.doctype.raven_channel_list.raven_channel_list import RavenChannelList
		from raven.raven.doctype.raven_dm_list.raven_dm_list import RavenDMList

		attach_print: DF.Check
		channel: DF.Literal["", "Channel", "DM"]
		condition: DF.Code | None
		date_changed: DF.Literal[None]
		days_in_advance: DF.Int
		dm: DF.TableMultiSelect[RavenDMList]
		document_type: DF.Link
		enabled: DF.Check
		event: DF.Literal["", "New", "Save", "Submit", "Cancel", "Days After", "Days Before", "Value Change", "Custom", "Method"]
		json: DF.JSON | None
		link: DF.Data | None
		message: DF.Code | None
		method: DF.Data | None
		raven_channel: DF.TableMultiSelect[RavenChannelList]
		recipients: DF.Table[NotificationRecipient]
		send_to_all_assignees: DF.Check
		subject: DF.Data | None
		value_changed: DF.Literal[None]
	# end: auto-generated types
	pass
# Copyright (c) 2018, Frappe Technologies and contributors
# License: MIT. See LICENSE

import json
import os
from collections import namedtuple

import frappe
from frappe import _
from frappe.core.doctype.role.role import get_info_based_on_role, get_user_info
from frappe.core.doctype.sms_settings.sms_settings import send_sms
from frappe.desk.doctype.notification_log.notification_log import enqueue_create_notification
from frappe.integrations.doctype.slack_webhook_url.slack_webhook_url import send_slack_message
from frappe.model.document import Document
from frappe.modules.utils import export_module_json, get_doc_module
from frappe.utils import add_to_date, cast, nowdate, validate_email_address
from frappe.utils.jinja import validate_template
from frappe.utils.safe_exec import get_safe_globals

from frappe.utils import get_site_url

import frappe
from frappe.model.document import Document
from jinja2 import Template

import frappe
from frappe.utils.print_format import download_pdf

import os
import frappe
from frappe.utils.pdf import get_pdf



# This function is calling in hooks for send message to raven
def send_a_raven(doc, method):
    
    try:
        if not doc or not doc.doctype:
            frappe.msgprint("Invalid input parameters")
            return
        
        # Fetch relevant Raven channels based on document type and method    
        raven_channel = get_raven_channel(doc.doctype,method)
        

        if raven_channel:
            for raven_notification_dict in raven_channel:
                # Check if there is a condition set for the notification
                condition = raven_notification_dict.get("condition")
                if condition:
                    # Evaluate the condition to determine if the notification should be sent
                    if eval(condition):
                        if raven_notification_dict.get("raven_channel"):
                            # Loop through each channel name and fetch Raven channels that are not direct messages
                            for channel_name in raven_notification_dict.get("raven_channel"):
                                channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                                
                                if channels and channels[0].get("is_direct_message") == 0:
                                    selected_channel = channels[0].get("name")
                                    raven_message = raven_channel[0].get("message")
                                    rendered_message = render_message_template(raven_message, doc)
                                    if raven_channel[0].get("json"):
                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                    else:
                                        json_data = {}
                                    
                                    link = raven_channel[0].get("link")
                                    # Set subject for the message, if available
                                    if raven_notification_dict.get("subject"):
                                        subject =  raven_notification_dict.get("subject")
                                    else:
                                        subject = ''
                                    

                                    # Create and send the Raven message
                                    create_and_send_raven_message(doc,subject ,selected_channel, rendered_message,json_data,link)
                                else:
                                    frappe.msgprint("No channels found")
                        else:
                            # Handle direct messages (DM)
                            if raven_notification_dict.get("dm"):
                                for raven_users in raven_notification_dict.get("dm"):
                                   
                                    # channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])

                                    # Construct DM channel name using the admin email and user
                                    admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                    channel_name = f"{admin_email} _ {raven_users}"
                                    # Fetch or create a direct message channel
                                    channel_id = frappe.db.get_value('Raven Channel', 
                                        {
                                            "channel_name": channel_name,
                                            "is_direct_message": 1
                                        }, 
                                        'name'
                                    )
                                    
                                    if not channel_id:
                                        # Create a new Raven Channel for direct messages
                                        channel_doc = frappe.new_doc('Raven Channel')
                                        channel_doc.channel_name = channel_name
                                        channel_doc.is_direct_message = True
                                        channel_doc.is_self_message = False  # Admin is not messaging themselves
                                        channel_doc.save()
                                        frappe.db.commit()
                                        channel_id = channel_doc.name
                                        print(f"Created new Raven Channel with ID: {channel_id}")
                                    else:
                                        print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                    
                                    # Create and send Raven Message
                                    if channel_id:
                                       
                                        selected_channel = channel_id
                                        raven_message = raven_channel[0].get("message")
                                        rendered_message = render_message_template(raven_message, doc)
                                        if raven_channel[0].get("json"):
                                            json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                        else:
                                            json_data = {}
                                        link = raven_channel[0].get("link")

                                        if raven_notification_dict.get("subject"):
                                            subject =  raven_notification_dict.get("subject")
                                        else:
                                            subject = ''
                                        

                                        # Create and send the Raven message
                                        create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                        print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                    else:
                                        print(f"Cannot create Raven Message; no valid Channel ID found.")
                else:
                    # Handle case when no condition is set
                    if raven_notification_dict.get("raven_channel"):
                        # Loop through each channel name and fetch Raven channels that are not direct messages
                        for channel_name in raven_notification_dict.get("raven_channel"):
                            channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                            
                            if channels and channels[0].get("is_direct_message") == 0:
                                selected_channel = channels[0].get("name")
                                raven_message = raven_channel[0].get("message")
                                rendered_message = render_message_template(raven_message, doc)
                                if raven_channel[0].get("json"):
                                    json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                else:
                                    json_data = {}
                                link = raven_channel[0].get("link")
                                if raven_notification_dict.get("subject"):
                                    subject =  raven_notification_dict.get("subject")
                                else:
                                    subject = ''
                                


                                create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                            else:
                                frappe.msgprint("No channels found")
                    else:
                        # Handle direct messages (DM) when no condition is set
                        if raven_notification_dict.get("dm"):
                            for raven_users in raven_notification_dict.get("dm"):
                                
                                # channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])


                                # admin_email = 'admin@example.com'
                                admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                channel_name = f"{admin_email} _ {raven_users}"
                                # Fetch or create a direct message channel
                                channel_id = frappe.db.get_value('Raven Channel', 
                                    {
                                        "channel_name": channel_name,
                                        "is_direct_message": 1
                                    }, 
                                    'name'
                                )
                                # Create a new Raven Channel for direct messages
                                if not channel_id:
                                    channel_doc = frappe.new_doc('Raven Channel')
                                    channel_doc.channel_name = channel_name
                                    channel_doc.is_direct_message = True
                                    channel_doc.is_self_message = False  # Admin is not messaging themselves
                                    channel_doc.save()
                                    frappe.db.commit()
                                    channel_id = channel_doc.name
                                    # channel_id = "v8hqeolvtj"
                                    print(f"Created new Raven Channel with ID: {channel_id}")
                                else:
                                    print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                
                                # Create and send Raven Message
                                if channel_id:
                                    
                                    selected_channel = channel_id
                                    # selected_channel = "admin@example.com _ kiran.rathod@bizmap.in"
                                    raven_message = raven_channel[0].get("message")
                                    rendered_message = render_message_template(raven_message, doc)
                                    if raven_channel[0].get("json"):
                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                    else:
                                        json_data = {}
                                    
                                    link = raven_channel[0].get("link")
                                    if raven_notification_dict.get("subject"):
                                        subject =  raven_notification_dict.get("subject")
                                    else:
                                        subject = ''
                                    


                                    create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                    print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                else:
                                    print(f"Cannot create Raven Message; no valid Channel ID found.")        
                            


        else:
            pass 
            
    except Exception as e:
        frappe.msgprint(f"An error occurred: {e}")





# here is code for fetch raven channels
def get_raven_channel(doctype, method):
    # Map the method/event to the corresponding event name used in Raven Notification
    event_map = {
        "validate": "Save",
        "on_submit": "Submit",
        "on_cancel": "Cancel",
        "after_insert":"New"
    }

   
     # Check if the method is mapped to a valid event
    if method in event_map:
        event = event_map[method]
        # Fetch Raven notifications based on the document type, event, and enabled status
        raven_notification = frappe.db.get_list(
            "Raven Notification",
            filters={"document_type": doctype, "event": event, "enabled": 1},
            fields=["raven_channel","subject" ,"channel","name","condition", "message", "json", "link"]
        )
        # Process each notification to fetch channels
        if raven_notification:
            for raven_notification_row in raven_notification:
               
                # Check if the channel type is 'Channel' and fetch the relevant Raven channels
                if raven_notification_row.get("channel") == 'Channel':
                    
                    
                    raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name")).as_dict()
                   
                    raven_channels = [channel.get('raven_channel') for channel in raven_notification_doc.raven_channel]
                  
                    raven_notification_row.update({'raven_channel' :raven_channels})                
                else:
                    # Fetch direct message users if the channel type is 'dm'
                    raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name")).as_dict()
                   
                    raven_channels = [channel.get('raven_users') for channel in raven_notification_doc.dm]
                   
                    raven_notification_row.update({'dm' : raven_channels})   
                    



        return raven_notification




    return None



# ==== this code is for daily event of raven notification===
# this function is calling in hooks for send msg to raven for daily
def send_raven_for_daily():
    # Call the function to get Raven notifications for daily events
    get_raven_notification_for_daily(None, 'daily')


    
    return

def get_raven_notification_for_daily(doctype, method=None):
    from frappe.email.doctype.notification.notification import get_documents_for_today
    import frappe
    
    if method == 'daily':
        # Fetch all active Raven notifications with events "Days Before" or "Days After"
        raven_notification = frappe.db.get_list(
            "Raven Notification",
            filters={ "event":("in", ("Days Before", "Days After")), "enabled": 1},
            fields=["raven_channel","subject" ,"channel","name","condition", 'date_changed','days_in_advance',"message", "json", "link"]
        )
        
        
        if raven_notification:
            # Get the document object for each Raven Notification row
            for raven_notification_row in raven_notification:
                
                raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name"))
                
                # If there is a callable function to get documents for today
                if callable(get_documents_for_today):
                    documents_for_today = raven_notification_doc.get_documents_for_today()
                    for doc in documents_for_today:
                       
                
                        # Determine the channels based on the notification row configuration
                        if raven_notification_row.get("channel") == 'Channel':
                            # Get all Raven channels linked to the notification
                            raven_channels = [channel.get('raven_channel') for channel in raven_notification_doc.raven_channel]
                            raven_notification_row.update({'raven_channel': raven_channels})
                            
                        else:
                            # Get all direct messages linked to the notification
                            raven_channels = [channel.get('raven_users') for channel in raven_notification_doc.dm]
                            raven_notification_row.update({'dm': raven_channels})
                           
                        # Retrieve the notification channel
                        raven_channel = raven_notification

                        if raven_channel:
                            # Iterate through each notification dictionary
                            for raven_notification_dict in raven_channel:
                                
                                condition = raven_notification_dict.get("condition")
                                if condition:
                                    
                                    if eval(condition):
                                        # Process if the condition is met
                                        if raven_notification_dict.get("raven_channel"):
                                            for channel_name in raven_notification_dict.get("raven_channel"):
                                                channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                                                # If the channel is found and not a direct message, send a message to the channel
                                                if channels and channels[0].get("is_direct_message") == 0:
                                                    selected_channel = channels[0].get("name")
                                                    raven_message = raven_channel[0].get("message")
                                                    rendered_message = render_message_template(raven_message, doc)
                                                    if raven_channel[0].get("json"):
                                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                    else:
                                                        json_data = {}
                                                    link = raven_channel[0].get("link")

                                                    if raven_notification_dict.get("subject"):
                                                        subject =  raven_notification_dict.get("subject")
                                                    else:
                                                        subject = ''
                                                    


                                                    create_and_send_raven_message(doc,subject ,selected_channel, rendered_message,json_data,link)
                                                else:
                                                    frappe.msgprint("No channels found")
                                        else:
                                            # Process direct messages if channel is not specified
                                            if raven_notification_dict.get("dm"):
                                                for raven_users in raven_notification_dict.get("dm"):
                                                    
                                                    admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                                    channel_name = f"{admin_email} _ {raven_users}"
                                                    channel_id = frappe.db.get_value('Raven Channel', 
                                                        {
                                                            "channel_name": channel_name,
                                                            "is_direct_message": 1
                                                        }, 
                                                        'name'
                                                    )
                                                    # Create a new channel if it does not exist
                                                    if not channel_id:
                                                        channel_doc = frappe.new_doc('Raven Channel')
                                                        channel_doc.channel_name = channel_name
                                                        channel_doc.is_direct_message = True
                                                        channel_doc.is_self_message = False  # Admin is not messaging themselves
                                                        channel_doc.save()
                                                        frappe.db.commit()
                                                        channel_id = channel_doc.name
                                                        print(f"Created new Raven Channel with ID: {channel_id}")
                                                    else:
                                                        print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                                    
                                                    # Create and send Raven Message
                                                    if channel_id:
                                                        
                                                        selected_channel = channel_id
                                                        # selected_channel = "Administrator _ kiran.rathod@bizmap.in"
                                                        raven_message = raven_channel[0].get("message")
                                                        rendered_message = render_message_template(raven_message, doc)
                                                        if raven_channel[0].get("json"):
                                                            json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                        else:
                                                            json_data = {}
                                                        link = raven_channel[0].get("link")

                                                        if raven_notification_dict.get("subject"):
                                                            subject =  raven_notification_dict.get("subject")
                                                        else:
                                                            subject = ''
                                                        


                                                        create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                                        print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                                    else:
                                                        print(f"Cannot create Raven Message; no valid Channel ID found.")
                                else:
                                    # Process direct messages if channel is not specified
                                    if raven_notification_dict.get("raven_channel"):
                                        # print(raven_notification_dict.get("raven_channel"),"====raven_notification_dict.get======")
                                        for channel_name in raven_notification_dict.get("raven_channel"):
                                            channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                                            
                                            # frappe.msgprint(f"{channels},===========")
                                            if channels and channels[0].get("is_direct_message") == 0:
                                                selected_channel = channels[0].get("name")
                                                raven_message = raven_channel[0].get("message")
                                                rendered_message = render_message_template(raven_message, doc)
                                                if raven_channel[0].get("json"):
                                                    json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                else:
                                                    json_data = {}
                                                link = raven_channel[0].get("link")
                                                if raven_notification_dict.get("subject"):
                                                    subject =  raven_notification_dict.get("subject")
                                                else:
                                                    subject = ''
                                                


                                                create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                            else:
                                                frappe.msgprint("No channels found")
                                    else:
                                        if raven_notification_dict.get("dm"):
                                            for raven_users in raven_notification_dict.get("dm"):
                                
                                                admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                                channel_name = f"{admin_email} _ {raven_users}"
                                                channel_id = frappe.db.get_value('Raven Channel', 
                                                    {
                                                        "channel_name": channel_name,
                                                        "is_direct_message": 1
                                                    }, 
                                                    'name'
                                                )
                                                # Create a new channel if it does not exist
                                                if not channel_id:
                                                    channel_doc = frappe.new_doc('Raven Channel')
                                                    channel_doc.channel_name = channel_name
                                                    channel_doc.is_direct_message = True
                                                    channel_doc.is_self_message = False  # Admin is not messaging themselves
                                                    channel_doc.save()
                                                    frappe.db.commit()
                                                    channel_id = channel_doc.name
                                                    print(f"Created new Raven Channel with ID: {channel_id}")
                                                else:
                                                    print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                                
                                                # Create and send Raven Message
                                                if channel_id:
                                                    
                                                    
                                                    selected_channel = channel_id
                                                    # selected_channel = "Administrator _ kiran.rathod@bizmap.in"
                                                    raven_message = raven_channel[0].get("message")
                                                    rendered_message = render_message_template(raven_message, doc)
                                                    if raven_channel[0].get("json"):
                                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                    else:
                                                        json_data = {}
                                                    link = raven_channel[0].get("link")
                                                    if raven_notification_dict.get("subject"):
                                                        subject =  raven_notification_dict.get("subject")
                                                    else:
                                                        subject = ''
                                                    


                                                    create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                                    print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                                else:
                                                    print(f"Cannot create Raven Message; no valid Channel ID found.")        
                                            


                        else:
                            pass 

                        
    
# Utility function to create a context for rendering
def get_context(doc):
    Frappe = namedtuple("frappe", ["utils"])
    return {
        "doc": doc,
        "nowdate": nowdate,
        "frappe": Frappe(utils=get_safe_globals().get("frappe").get("utils")),
    }

# get list of documents that will be triggered today
# Class definition for RavenNotification
class RavenNotification(Document):
    # Method to get documents that will be triggered today
    def get_documents_for_today(self):
            """get list of documents that will be triggered today"""
            docs = []
            # Calculate the reference date based on the event and days in advance
            diff_days = self.days_in_advance
            if self.event == "Days After":
                diff_days = -diff_days

            # Determine the start and end of the reference date
            reference_date = add_to_date(nowdate(), days=diff_days)
            reference_date_start = reference_date + " 00:00:00.000000"
            reference_date_end = reference_date + " 23:59:59.000000"
            # Fetch documents within the reference date range
            doc_list = frappe.get_all(
                self.document_type,
                fields="name",
                filters=[
                    {self.date_changed: (">=", reference_date_start)},
                    {self.date_changed: ("<=", reference_date_end)},
                ],
            )
            # Filter documents based on condition if provided
            for d in doc_list:
                doc = frappe.get_doc(self.document_type, d.name)

                if self.condition and not frappe.safe_eval(self.condition, None, get_context(doc)):
                    continue

                docs.append(doc)

            return docs



# This code for value change event of raven notification
# Trigger function for value change event
def trigger_on_save_for_value_change(doc, method):
    # Fetch Raven notifications that are enabled and have 'Value Change' event
    raven_notification = frappe.db.get_list(
            "Raven Notification",
            filters={"document_type": doc.doctype, "event": 'Value Change', "enabled": 1},
            fields=["raven_channel","subject" ,"channel","event","value_changed","name","condition", "message", "json", "link"]
        )

    if raven_notification:
        for raven_notification_row in raven_notification:
            
            # Update raven_notification_row with channels based on its type
            if raven_notification_row.get("channel") == 'Channel':
                
                
                raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name")).as_dict()
                
                raven_channels = [channel.get('raven_channel') for channel in raven_notification_doc.raven_channel]
                

                
                raven_notification_row.update({'raven_channel' :raven_channels})                
            else:
                raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name")).as_dict()
                
                raven_channels = [channel.get('raven_users') for channel in raven_notification_doc.dm]
                
                raven_notification_row.update({'dm' : raven_channels})   

            
                


    
    # Check for value changes and process notifications accordingly
    if raven_notification:
        for row in raven_notification:
            value_changed = row.get("value_changed")
            if value_changed:
                old_doc = frappe.db.get_all(doctype=doc.doctype,filters={"name": doc.name},fields=["name", value_changed])
                if old_doc and old_doc[0].get(value_changed):
                    if old_doc[0].get(value_changed) != doc.get(value_changed):

                        raven_channel = raven_notification

                        if raven_channel:
                            
                            for raven_notification_dict in raven_channel:
                                
                                condition = raven_notification_dict.get("condition")
                                if condition:
                                    
                                    if eval(condition):
                                        if raven_notification_dict.get("raven_channel"):
                                            for channel_name in raven_notification_dict.get("raven_channel"):
                                                channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                                                
                                                if channels and channels[0].get("is_direct_message") == 0:
                                                    selected_channel = channels[0].get("name")
                                                    raven_message = raven_channel[0].get("message")
                                                    rendered_message = render_message_template(raven_message, doc)
                                                    if raven_channel[0].get("json"):
                                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                    else:
                                                        json_data = {}
                                                    link = raven_channel[0].get("link")

                                                    if raven_notification_dict.get("subject"):
                                                        subject =  raven_notification_dict.get("subject")
                                                    else:
                                                        subject = ''
                                                    


                                                    create_and_send_raven_message(doc,subject ,selected_channel, rendered_message,json_data,link)
                                                else:
                                                    frappe.msgprint("No channels found")
                                        else:
                                            if raven_notification_dict.get("dm"):
                                                for raven_users in raven_notification_dict.get("dm"):
                                                   
                                                    admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                                    channel_name = f"{admin_email} _ {raven_users}"
                                                    channel_id = frappe.db.get_value('Raven Channel', 
                                                        {
                                                            "channel_name": channel_name,
                                                            "is_direct_message": 1
                                                        }, 
                                                        'name'
                                                    )
                                                    
                                                    if not channel_id:
                                                        channel_doc = frappe.new_doc('Raven Channel')
                                                        channel_doc.channel_name = channel_name
                                                        channel_doc.is_direct_message = True
                                                        channel_doc.is_self_message = False  # Admin is not messaging themselves
                                                        channel_doc.save()
                                                        frappe.db.commit()
                                                        channel_id = channel_doc.name
                                                        print(f"Created new Raven Channel with ID: {channel_id}")
                                                    else:
                                                        print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                                    
                                                    # Create and send Raven Message
                                                    if channel_id:
                                                        
                                                        selected_channel = channel_id
                                                        # selected_channel = "Administrator _ kiran.rathod@bizmap.in"
                                                        raven_message = raven_channel[0].get("message")
                                                        rendered_message = render_message_template(raven_message, doc)
                                                        if raven_channel[0].get("json"):
                                                            json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                        else:
                                                            json_data = {}
                                                        link = raven_channel[0].get("link")

                                                        if raven_notification_dict.get("subject"):
                                                            subject =  raven_notification_dict.get("subject")
                                                        else:
                                                            subject = ''
                                                       

                                                        create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                                        print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                                    else:
                                                        print(f"Cannot create Raven Message; no valid Channel ID found.")
                                else:
                                    
                                    if raven_notification_dict.get("raven_channel"):
                                        
                                        for channel_name in raven_notification_dict.get("raven_channel"):
                                            channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                                            
                                            
                                            if channels and channels[0].get("is_direct_message") == 0:
                                                selected_channel = channels[0].get("name")
                                                raven_message = raven_channel[0].get("message")
                                                rendered_message = render_message_template(raven_message, doc)
                                                if raven_channel[0].get("json"):
                                                    json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                else:
                                                    json_data = {}
                                                link = raven_channel[0].get("link")
                                                if raven_notification_dict.get("subject"):
                                                    subject =  raven_notification_dict.get("subject")
                                                else:
                                                    subject = ''
                               

                                                create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                            else:
                                                frappe.msgprint("No channels found")
                                    else:
                                        if raven_notification_dict.get("dm"):
                                            for raven_users in raven_notification_dict.get("dm"):
            


                                                admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                                channel_name = f"{admin_email} _ {raven_users}"
                                                channel_id = frappe.db.get_value('Raven Channel', 
                                                    {
                                                        "channel_name": channel_name,
                                                        "is_direct_message": 1
                                                    }, 
                                                    'name'
                                                )
                                                
                                                if not channel_id:
                                                    channel_doc = frappe.new_doc('Raven Channel')
                                                    channel_doc.channel_name = channel_name
                                                    channel_doc.is_direct_message = True
                                                    channel_doc.is_self_message = False  # Admin is not messaging themselves
                                                    channel_doc.save()
                                                    frappe.db.commit()
                                                    channel_id = channel_doc.name
                                                    print(f"Created new Raven Channel with ID: {channel_id}")
                                                else:
                                                    print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                                
                                                # Create and send Raven Message
                                                if channel_id:
                                                    
                                                    
                                                    selected_channel = channel_id
                                                    # selected_channel = "Administrator _ kiran.rathod@bizmap.in"
                                                    raven_message = raven_channel[0].get("message")
                                                    rendered_message = render_message_template(raven_message, doc)
                                                    if raven_channel[0].get("json"):
                                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                                    else:
                                                        json_data = {}
                                                    
                                                    link = raven_channel[0].get("link")
                                                    if raven_notification_dict.get("subject"):
                                                        subject =  raven_notification_dict.get("subject")
                                                    else:
                                                        subject = ''
                                                    


                                                    create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                                    print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                                else:
                                                    print(f"Cannot create Raven Message; no valid Channel ID found.")        
                                            
                        else:
                            pass 

                        
    
    return raven_notification


    
# this code fetching data from json data
def get_data_from_json(doc, json_data_str):
    import json
    from datetime import date
    # Parse the JSON string to a Python dictionary
    json_data = json.loads(json_data_str)
    extracted_data = {}

    # Extract fields from the main document (doctype fields)
    doctype_fields = json_data.get("doctype_fields", {})
    for field in doctype_fields:
        value = doc.get(field)
        if isinstance(value, date):
            value = value.isoformat()  
        extracted_data[field] = value

   # Extract fields from the child tables
    child_table_fields = json_data.get("child_table_fields", {})
    for child_table, fields in child_table_fields.items():
        # Get the child table entries from the document
        child_entries = doc.get(child_table, [])
        
        # Initialize a list to store extracted data for each child table
        extracted_data[child_table] = []

       # Iterate over each entry in the child table and extract specified fields
        for entry in child_entries:
            row_data = {}
            for field in fields:
                value = entry.get(field)
                # Convert date fields to ISO format string
                if isinstance(value, date):
                    value = value.isoformat()  
                row_data[field] = value
            extracted_data[child_table].append(row_data)

    return extracted_data


# Create a Template object from the provided template string and render it using the given 'doc' dictionary.
# this code is creating message template for raven from raven notification
def render_message_template(template_str, doc):
    template = Template(template_str)
    return template.render(doc=doc)


import json
from markupsafe import Markup

def json_to_html(json_data):
    """
    Converts JSON data to an HTML representation. This function expects JSON data to be in a dictionary format 
    with possible child table entries represented as lists.

    Args:
        json_data (str or dict): The JSON data to convert. Can be a JSON string or a dictionary.

    Returns:
        Markup: An HTML representation of the JSON data.
    """
    # Check if json_data is a string and try to parse it
    if isinstance(json_data, str):
        try:
            json_data = json.loads(json_data)
        except json.JSONDecodeError as e:
            return f"Error decoding JSON: {str(e)}"

    html_content = ""

    # Check if json_data is a dictionary
    if isinstance(json_data, dict):
        main_fields = {} # To store main fields
        child_table_fields = {}   # To store fields for child tables

        # Separate main fields and child table fields
        for key, value in json_data.items():
            if isinstance(value, list): 
                child_table_fields[key] = value
            else:
                main_fields[key] = value

        # Generate HTML for main fields
        for key, value in main_fields.items():
            html_content += f"<p><strong>{key}:</strong> {value}</p>"

        # Generate HTML for child table fields
        for table_name, rows in child_table_fields.items():
            if rows: # Only process non-empty child table fields
                headers = rows[0].keys() # Get the headers for the table

                # Create table HTML
                html_content += f"<p><strong>{table_name}:</strong></p>"
                html_content += "<table border='1' style='border-collapse: collapse; width: 100%;'>"
                html_content += "<tr>"
                for header in headers:
                    html_content += f"<th>{header}</th>"
                html_content += "</tr>"

                # Fill table rows with data
                for row in rows:
                    html_content += "<tr>"
                    for header in headers:
                        cell_value = row.get(header, "")
                        html_content += f"<td>{cell_value if cell_value is not None else ''}</td>"
                    html_content += "</tr>"

                html_content += "</table>"
    else:
        return "Invalid JSON data format. Expected a dictionary."

    return Markup(html_content)




# this function is prepare for send raven message
def create_and_send_raven_message(doc, subject,channel, raven_message, json_data, link):
    # fetch session user
    user = frappe.session.user
    try:
        
        if isinstance(json_data, dict):
            json_data_str = json.dumps(json_data)
        else:
            json_data_str = json_data
        
        json_html = json_to_html(json_data_str)
        # prepare subject for raven message
        subject = frappe.render_template(subject, {'doc': doc})
        
        rendered_message = Markup(
            
            f"<h2><b>{subject}</b></h2><br>"
            f"{raven_message}<br>{json_html}<br>"
            f"<a href='{link}{doc.name}'> Go To {doc.doctype} {doc.name}</a><br>"
           
            
        ) 
        # create new doc for raven message 
        raven_message_doc = frappe.new_doc("Raven Message")
        raven_message_doc.text = rendered_message
        raven_message_doc.channel_id = channel
        raven_message_doc.json = json_data
        raven_message_doc.save()
        
        frappe.db.commit()
        process_message(doc, channel, raven_message)
    except Exception as e:
        frappe.msgprint(f"An error occurred while creating or sending the Raven message: {e}")



        
def process_message(doc, channel, message):
    if channel:
        if_not_dm_channel = frappe.db.get_value("Raven Channel",channel,"is_direct_message" )
        if not if_not_dm_channel:
            frappe.msgprint(f"<b>Sending message to channel :{channel} </b>")



# this method calling through hooks.py 
#  Send a Raven for Method Event 
def send_a_raven_for_method_event(doc,method):

    if method:
        # Fetch Raven Notifications based on the document type, event, method, and enabled status
        raven_notification = frappe.db.get_list(
            "Raven Notification",
            filters={"document_type": doc.doctype, "event": "Method", "method":method,"enabled": 1},
            fields=["raven_channel","subject" ,"channel","name","condition", "message", "json", "link"]
        )
        # If any Raven Notifications are found
        if raven_notification:
            # Iterate over each Raven Notification row
            for raven_notification_row in raven_notification:
            
                if raven_notification_row.get("channel") == 'Channel':
                    
                    # Fetch and convert Raven Notification doc into a dictionary
                    raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name")).as_dict()
                    # Extract 'raven_channel' information
                    raven_channels = [channel.get('raven_channel') for channel in raven_notification_doc.raven_channel]
                    
                    # Update the row with fetched 'raven_channel' data
                    raven_notification_row.update({'raven_channel' :raven_channels})                
                else:
                    # Handle cases where the channel is not 'Channel' (Direct Message scenario)
                    raven_notification_doc = frappe.get_doc("Raven Notification", raven_notification_row.get("name")).as_dict()
                    # Extract 'raven_users' information for direct messages
                    raven_channels = [channel.get('raven_users') for channel in raven_notification_doc.dm]
                     # Update the row with fetched direct message channels
                    raven_notification_row.update({'dm' : raven_channels})   
                    


        # Set raven_channel to the list of fetched Raven Notifications
        raven_channel = raven_notification
        # If Raven Notifications are present
        if raven_channel:
            
            for raven_notification_dict in raven_channel:
                
                condition = raven_notification_dict.get("condition")
                if condition:
                    
                    if eval(condition):
                        # If a raven channel exists, send notifications to channels
                        if raven_notification_dict.get("raven_channel"):
                            for channel_name in raven_notification_dict.get("raven_channel"):
                                # Fetch channel details from Raven Channel doctype
                                channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                                # If the channel is not a direct message, send notification
                                if channels and channels[0].get("is_direct_message") == 0:
                                    selected_channel = channels[0].get("name")
                                    raven_message = raven_channel[0].get("message")
                                    # Render message template and fetch JSON data
                                    rendered_message = render_message_template(raven_message, doc)
                                    if raven_channel[0].get("json"):
                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                    else:
                                        json_data = {}
                                    link = raven_channel[0].get("link")

                                    # Get the subject for the notification
                                    if raven_notification_dict.get("subject"):
                                        subject =  raven_notification_dict.get("subject")
                                    else:
                                        subject = ''
                                    

                                    # Send the Raven Message
                                    create_and_send_raven_message(doc,subject ,selected_channel, rendered_message,json_data,link)
                                else:
                                    frappe.msgprint("No channels found")
                        else:
                            # Handle sending of direct messages
                            if raven_notification_dict.get("dm"):
                                for raven_users in raven_notification_dict.get("dm"):
                                    
                                    # channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])

                                    # Prepare the direct message channel name
                                    admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                    channel_name = f"{admin_email} _ {raven_users}"
                                    # Check if the channel already exists
                                    channel_id = frappe.db.get_value('Raven Channel', 
                                        {
                                            "channel_name": channel_name,
                                            "is_direct_message": 1
                                        }, 
                                        'name'
                                    )
                                    # If the channel does not exist, create a new Raven Channel
                                    if not channel_id:
                                        channel_doc = frappe.new_doc('Raven Channel')
                                        channel_doc.channel_name = channel_name
                                        channel_doc.is_direct_message = True
                                        channel_doc.is_self_message = False  # Admin is not messaging themselves
                                        channel_doc.save()
                                        frappe.db.commit()
                                        channel_id = channel_doc.name
                                        print(f"Created new Raven Channel with ID: {channel_id}")
                                    else:
                                        print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                    
                                    # Create and send Raven Message
                                    if channel_id:
                                        
                                        selected_channel = channel_id
                                        # selected_channel = "Administrator _ kiran.rathod@bizmap.in"
                                        raven_message = raven_channel[0].get("message")
                                        rendered_message = render_message_template(raven_message, doc)
                                        if raven_channel[0].get("json"):
                                            json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                        else:
                                            json_data = {}
                                        link = raven_channel[0].get("link")

                                        if raven_notification_dict.get("subject"):
                                            subject =  raven_notification_dict.get("subject")
                                        else:
                                            subject = ''

                                        create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                        print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                    else:
                                        print(f"Cannot create Raven Message; no valid Channel ID found.")
                else:
                    # Handle cases where no condition is provided
                    if raven_notification_dict.get("raven_channel"):
                        
                        for channel_name in raven_notification_dict.get("raven_channel"):
                            channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])
                            
                           # If the channel is not a direct message, send notification
                            if channels and channels[0].get("is_direct_message") == 0:
                                selected_channel = channels[0].get("name")
                                raven_message = raven_channel[0].get("message")
                                rendered_message = render_message_template(raven_message, doc)
                                if raven_channel[0].get("json"):
                                    json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                else:
                                    json_data = {}
                                link = raven_channel[0].get("link")
                                if raven_notification_dict.get("subject"):
                                    subject =  raven_notification_dict.get("subject")
                                else:
                                    subject = ''


                                create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                            else:
                                frappe.msgprint("No channels found")
                    else:
                        if raven_notification_dict.get("dm"):
                            for raven_users in raven_notification_dict.get("dm"):
                               
                                
                                # channels = frappe.get_all("Raven Channel", filters={"name": channel_name}, fields=["name", "channel_name", "is_direct_message"])


                                admin_email = frappe.db.get_value('User', 'Administrator', 'username')
                                channel_name = f"{admin_email} _ {raven_users}"
                                channel_id = frappe.db.get_value('Raven Channel', 
                                    {
                                        "channel_name": channel_name,
                                        "is_direct_message": 1
                                    }, 
                                    'name'
                                )
                                
                                if not channel_id:
                                    channel_doc = frappe.new_doc('Raven Channel')
                                    channel_doc.channel_name = channel_name
                                    channel_doc.is_direct_message = True
                                    channel_doc.is_self_message = False  # Admin is not messaging themselves
                                    channel_doc.save()
                                    frappe.db.commit()
                                    channel_id = channel_doc.name
                                    print(f"Created new Raven Channel with ID: {channel_id}")
                                else:
                                    print(f"Fetched existing Raven Channel with ID: {channel_id}")
                                
                                # Create and send Raven Message
                                if channel_id:
                                    
                                    
                                    selected_channel = channel_id
                                    # selected_channel = "Administrator _ kiran.rathod@bizmap.in"
                                    raven_message = raven_channel[0].get("message")
                                    rendered_message = render_message_template(raven_message, doc)
                                    if raven_channel[0].get("json"):
                                        json_data = get_data_from_json(doc,raven_channel[0].get("json"))
                                    else:
                                        json_data = {}
                                    link = raven_channel[0].get("link")
                                    if raven_notification_dict.get("subject"):
                                        subject =  raven_notification_dict.get("subject")
                                    else:
                                        subject = ''
                                  
                                    create_and_send_raven_message(doc, subject,selected_channel, rendered_message,json_data,link)
                                    print(f"Created new Raven Message linked to Channel ID: {channel_id}")
                                else:
                                    print(f"Cannot create Raven Message; no valid Channel ID found.")        
                            


        else:
            pass 

      



      