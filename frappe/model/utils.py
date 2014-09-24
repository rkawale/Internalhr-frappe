# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt 

from __future__ import unicode_literals
import frappe, json
from frappe import _
"""
Model utilities, unclassified functions
"""

def set_default(doc, key):
	if not doc.is_default:
		frappe.db.set(doc, "is_default", 1)
	
	frappe.db.sql("""update `tab%s` set `is_default`=0
		where `%s`=%s and name!=%s""" % (doc.doctype, key, "%s", "%s"), 
		(doc.get(key), doc.name))
