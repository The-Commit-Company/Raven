
export interface RavenUser {
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
	/**	Type : Select	*/
	type: "User" | "Bot"
	/**	User : Link - User	*/
	user?: string
	/**	Bot : Link - Raven Bot	*/
	bot?: string
	/**	Full Name : Data	*/
	full_name?: string
	/**	First Name : Data	*/
	first_name?: string
	/**	User Image : Attach Image	*/
	user_image?: string
	/**	Enabled : Check	*/
	enabled?: 0 | 1
}