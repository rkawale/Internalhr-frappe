# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals

import frappe, os, json
from frappe.modules import scrub, get_module_path, scrub_dt_dn
from frappe.utils import get_datetime_str

def import_files(module, dt=None, dn=None, force=False):
	if type(module) is list:
		out = []
		for m in module:
			out.append(import_file(m[0], m[1], m[2], force=force))
		return out
	else:
		return import_file(module, dt, dn, force=force)

def import_file(module, dt, dn, force=False):
	"""Sync a file from txt if modifed, return false if not updated"""
	path = get_file_path(module, dt, dn)
	ret = import_file_by_path(path, force)
	return ret

def get_file_path(module, dt, dn):
	dt, dn = scrub_dt_dn(dt, dn)

	path = os.path.join(get_module_path(module),
		os.path.join(dt, dn, dn + ".json"))

	return path

def import_file_by_path(path, force=False):
	frappe.flags.in_import = True
	docs = read_doc_from_file(path)

	if docs:
		if not isinstance(docs, list):
			docs = [docs]

		for doc in docs:
			if not force:
				# check if timestamps match
				db_modified = frappe.db.get_value(doc['doctype'], doc['name'], 'modified')
				if db_modified and doc.get('modified')==get_datetime_str(db_modified):
					return False

			original_modified = doc.get("modified")

			import_doc(doc)

			if original_modified:
				# since there is a new timestamp on the file, update timestamp in
				if doc["doctype"] == doc["name"]:
					frappe.db.sql("""update tabSingles set value=%s where field="modified" and doctype=%s""",
						(original_modified, doc["name"]))
				else:
					frappe.db.sql("update `tab%s` set modified=%s where name=%s" % \
						(doc['doctype'], '%s', '%s'),
						(original_modified, doc['name']))

	frappe.flags.in_import = False
	return True

def read_doc_from_file(path):
	doc = None
	if os.path.exists(path):
		with open(path, 'r') as f:
			doc = json.loads(f.read())
	else:
		raise Exception, '%s missing' % path

	return doc

ignore_values = {
	"Report": ["disabled"],
}

ignore_doctypes = ["Page Role", "DocPerm"]

def import_doc(docdict):
	docdict["__islocal"] = 1
	doc = frappe.get_doc(docdict)

	ignore = []

	if frappe.db.exists(doc.doctype, doc.name):
		old_doc = frappe.get_doc(doc.doctype, doc.name)

		if doc.doctype in ignore_values:
			# update ignore values
			for key in ignore_values.get(doc.doctype) or []:
				doc.set(key, old_doc.get(key))

		# update ignored docs into new doc
		for df in doc.meta.get_table_fields():
			if df.options in ignore_doctypes:
				doc.set(df.fieldname, [])
				ignore.append(df.options)

		# delete old
		frappe.delete_doc(doc.doctype, doc.name, force=1, ignore_doctypes=ignore, for_reload=True)

	doc.ignore_children_type = ignore
	doc.ignore_links = True
	doc.ignore_validate = True
	doc.ignore_permissions = True
	doc.ignore_mandatory = True
	doc.ignore_restrictions = True
	doc.insert()
