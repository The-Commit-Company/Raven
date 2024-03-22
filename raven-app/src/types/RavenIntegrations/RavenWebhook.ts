import { WebhookHeader } from '../Integrations/WebhookHeader'
import { WebhookData } from '../Integrations/WebhookData'

export interface RavenWebhook{
	creation: string
	name: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/**	Enabled : Check	*/
	enabled?: 0 | 1
	/**	Trigger Webhook on Condition : Check	*/
	trigger_webhook_on_condition?: 0 | 1
	/**	Channel : Link - Raven Channel	*/
	channel_id?: string
	/**	User : Link - Raven User	*/
	user?: string
	/**	Channel Type : Select	*/
	channel_type?: "" | "Public" | "Private" | "Open" | "DM" | "Self Message"
	/**	Condition : Small Text - The webhook will be triggered if this expression is true	*/
	condition?: string
	/**	Webhook Trigger : Select	*/
	webhook_trigger: "Message Sent" | "Message Edited" | "Message Deleted" | "Message Reaction" | "Channel Created" | "Channel Deleted" | "Channel Member Added" | "Channel Member Deleted" | "Raven User Added" | "Raven User Deleted"
	/**	Conditions On : Select	*/
	conditions_on?: "" | "Channel" | "User" | "Channel Type" | "Custom"
	/**	Request URL : Data	*/
	request_url: string
	/**	Request Timeout : Int - The number of seconds until the request expires	*/
	timeout: number
	/**	Is Dynamic URL? : Check - On checking this option, URL will be treated like a jinja template string	*/
	is_dynamic_url?: 0 | 1
	/**	Enable Security : Check	*/
	enable_security?: 0 | 1
	/**	Webhook Secret : Password	*/
	webhook_secret?: string
	/**	Headers : Table - Webhook Header	*/
	webhook_headers?: WebhookHeader[]
	/**	Data : Table - Webhook Data	*/
	webhook_data?: WebhookData[]
	/**	Webhook : Link - Webhook	*/
	webhook?: string
}