# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe
from frappe.utils import cint

from frappe.model.document import Document

class UserRole(Document):
	def validate(self):
		if cint(self.get("__islocal")) and frappe.db.exists("UserRole", {
				"parent": self.parent, "role": self.role}):
			frappe.throw(frappe._("Role exists"))
