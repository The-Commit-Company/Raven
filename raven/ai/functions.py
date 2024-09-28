import frappe
from frappe import _


def get_document(doctype: str, document_id: str):
	"""
	Get a document from the database
	"""
	# Use the frappe.client.get method to get the document with permissions (both read and field level read)
	return frappe.client.get(doctype, name=document_id)


def get_documents(doctype: str, document_ids: list):
	"""
	Get documents from the database
	"""
	docs = []
	for document_id in document_ids:
		# Use the frappe.client.get method to get the document with permissions applied
		docs.append(frappe.client.get(doctype, name=document_id))
	return docs


def create_document(doctype: str, data: dict):
	"""
	Create a document in the database
	"""
	doc = frappe.get_doc({"doctype": doctype, **data})
	doc.insert()
	return {"document_id": doc.name, "message": "Document created", "doctype": doctype}


def create_documents(doctype: str, data: list):
	"""
	Create documents in the database
	"""
	docs = []
	for item in data:
		doc = frappe.get_doc({"doctype": doctype, **item})
		doc.insert()
		docs.append(doc.name)

	return {"documents": docs, "message": "Documents created", "doctype": doctype}


def update_document(doctype: str, document_id: str, data: dict):
	"""
	Update a document in the database
	"""
	doc = frappe.get_doc(doctype, document_id)
	doc.update(data)
	doc.save()
	return {"document_id": doc.name, "message": "Document updated", "doctype": doctype}


def update_documents(doctype: str, document_ids: list, data: dict):
	"""
	Update documents in the database
	"""
	for document_id in document_ids:
		doc = frappe.get_doc(doctype, document_id)
		doc.update(data)
		doc.save()
	return {"document_ids": document_ids, "message": "Documents updated", "doctype": doctype}


def delete_document(doctype: str, document_id: str):
	"""
	Delete a document from the database
	"""
	frappe.delete_doc(doctype, document_id)
	return {"document_id": document_id, "message": "Document deleted", "doctype": doctype}


def delete_documents(doctype: str, document_ids: list):
	"""
	Delete documents from the database
	"""
	for document_id in document_ids:
		frappe.delete_doc(doctype, document_id)
	return {"document_ids": document_ids, "message": "Documents deleted", "doctype": doctype}


def attach_file_to_document(doctype: str, document_id: str, file_path: str):
	"""
	Attach a file to a document in the database
	"""
	file = frappe.get_doc("File", {"file_url": file_path})

	if not file:
		frappe.throw(_("File not found"))

	newFile = frappe.get_doc(
		{
			"doctype": "File",
			"file_url": file_path,
			"attached_to_doctype": doctype,
			"attached_to_name": document_id,
			"folder": file.folder,
			"file_name": file.file_name,
			"is_private": file.is_private,
		}
	)
	newFile.insert()

	return {"document_id": document_id, "message": "File attached", "file_id": newFile.name}