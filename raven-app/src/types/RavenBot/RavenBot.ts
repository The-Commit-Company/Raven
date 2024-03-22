
export interface RavenBot{
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
	/**	Bot Name : Data	*/
	bot_name?: string
	/**	Description : Data	*/
	description?: string
	/**	Image : Attach Image	*/
	image?: string
	/**	Enabled : Check	*/
	enabled?: 0 | 1
	/**	Is Standard : Check	*/
	is_standard?: 0 | 1
	/**	Module : Link - Module Def	*/
	module?: string
}