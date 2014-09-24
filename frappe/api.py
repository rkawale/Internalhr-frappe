# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

import json
import frappe
import frappe.handler
import frappe.client
import frappe.widgets.reportview
from frappe.utils.response import build_response
from frappe import _

def handle():
	"""
	/api/method/{methodname} will call a whitelisted method
	/api/resource/{doctype} will query a table
		examples:
			?fields=["name", "owner"]
			?filters=[["Task", "name", "like", "%005"]]
			?limit_start=0
			?limit_page_length=20
	/api/resource/{doctype}/{name} will point to a resource
		GET will return doclist
		POST will insert
		PUT will update
		DELETE will delete
	/api/resource/{doctype}/{name}?run_method={method} will run a whitelisted controller method
	"""
	parts = frappe.request.path[1:].split("/")
	call = doctype = name = None

	if len(parts) > 1:
		call = parts[1]

	if len(parts) > 2:
		doctype = parts[2]

	if len(parts) > 3:
		name = parts[3]

	if call=="method":
		frappe.local.form_dict.cmd = doctype
		return frappe.handler.handle()

	elif call=="resource":
		if "run_method" in frappe.local.form_dict:
			doc = frappe.get_doc(doctype, name)

			if frappe.local.request.method=="GET":
				if not doc.has_permission("read"):
					frappe.throw(_("Not permitted"), frappe.PermissionError)
				doc.run_method(frappe.local.form_dict.run_method, **frappe.local.form_dict)

			if frappe.local.request.method=="POST":
				if not doc.has_permission("write"):
					frappe.throw(_("Not permitted"), frappe.PermissionError)
				doc.run_method(frappe.local.form_dict.run_method, **frappe.local.form_dict)
				frappe.db.commit()

		else:
			if name:
				if frappe.local.request.method=="GET":
					doc = frappe.get_doc(doctype, name)
					if not doc.has_permission("read"):
						raise frappe.PermissionError
					frappe.local.response.update({"data": doc})

				if frappe.local.request.method=="PUT":
					data = json.loads(frappe.local.form_dict.data)
					doc = frappe.get_doc(doctype, name)
					# Not checking permissions here because it's checked in doc.save
					doc.update(data)
					frappe.local.response.update({ 
							"data": doc.save().as_dict()
					})
					frappe.db.commit()

				if frappe.local.request.method=="DELETE":
					doc.update(data)
					# Not checking permissions here because it's checked in delete_doc
					frappe.delete_doc(doctype, name)
					frappe.local.response.http_status_code = 202
					frappe.local.response.message = "ok"
					frappe.db.commit()


			elif doctype:
				if frappe.local.request.method=="GET":
					if frappe.local.form_dict.get('fields'):
						frappe.local.form_dict['fields'] = json.loads(frappe.local.form_dict['fields'])
					frappe.local.response.update({
						"data":  frappe.call(frappe.widgets.reportview.execute,
							doctype, **frappe.local.form_dict)})

				if frappe.local.request.method=="POST":
					data = json.loads(frappe.local.form_dict.data)
					data.update({
						"doctype": doctype
					})
					frappe.local.response.update({
						"data": frappe.get_doc(data).insert().as_dict()
					})
					frappe.db.commit()
			else:
				raise frappe.DoesNotExistError

	else:
		raise frappe.DoesNotExistError

	return build_response("json")
