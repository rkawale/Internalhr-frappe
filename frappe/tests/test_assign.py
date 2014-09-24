# Copyright (c) 2014, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

import frappe, unittest
import frappe.widgets.form.assign_to

class TestAssign(unittest.TestCase):
	def test_assign(self):
		todo = frappe.get_doc({"doctype":"ToDo", "description": "test"}).insert()
		if not frappe.db.exists("User", "test@example.com"):
			frappe.get_doc({"doctype":"User", "email":"test@example.com", "first_name":"Test"})

		added = frappe.widgets.form.assign_to.add({
			"assign_to": "test@example.com",
			"doctype": todo.doctype,
			"name": todo.name,
			"description": todo.description,
		})
		self.assertTrue("test@example.com" in added)
		
		removed = frappe.widgets.form.assign_to.remove(todo.doctype, todo.name, "test@example.com")
		self.assertTrue("test@example.com" not in removed)
