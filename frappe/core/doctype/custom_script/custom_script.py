# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt 
from __future__ import unicode_literals
import frappe
from frappe.utils import cstr

from frappe.model.document import Document

class CustomScript(Document):
		
	def autoname(self):
		self.name = self.dt + "-" + self.script_type

	def on_update(self):
		frappe.clear_cache(doctype=self.dt)
	
	def on_trash(self):
		frappe.clear_cache(doctype=self.dt)

