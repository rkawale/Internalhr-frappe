# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

import frappe, unittest

from frappe.model.delete_doc import delete_doc

test_records = frappe.get_test_records('User')

class TestUser(unittest.TestCase):
	def test_delete(self):
		frappe.get_doc("User", "test@example.com").add_roles("_Test Role 2")
		self.assertRaises(frappe.LinkExistsError, delete_doc, "Role", "_Test Role 2")
		frappe.db.sql("""delete from tabUserRole where role='_Test Role 2'""")
		delete_doc("Role","_Test Role 2")

		user = frappe.copy_doc(test_records[1])
		user.email = "_test@example.com"
		user.insert()

		frappe.get_doc({"doctype": "ToDo", "description": "_Test"}).insert()

		delete_doc("User", "_test@example.com")

		self.assertTrue(not frappe.db.sql("""select * from `tabToDo` where owner=%s""",
			("_test@example.com",)))

		from frappe.core.doctype.role.test_role import test_records as role_records
		frappe.copy_doc(role_records[1]).insert()

	def test_get_value(self):
		self.assertEquals(frappe.db.get_value("User", "test@example.com"), "test@example.com")
		self.assertEquals(frappe.db.get_value("User", {"email":"test@example.com"}), "test@example.com")
		self.assertEquals(frappe.db.get_value("User", {"email":"test@example.com"}, "email"), "test@example.com")
		self.assertEquals(frappe.db.get_value("User", {"email":"test@example.com"}, ["first_name", "email"]),
			("_Test", "test@example.com"))
		self.assertEquals(frappe.db.get_value("User",
			{"email":"test@example.com", "first_name": "_Test"},
			["first_name", "email"]),
				("_Test", "test@example.com"))

		test_user = frappe.db.sql("select * from tabUser where name='test@example.com'",
			as_dict=True)[0]
		self.assertEquals(frappe.db.get_value("User", {"email":"test@example.com"}, "*", as_dict=True),
			test_user)

		self.assertEquals(frappe.db.get_value("User", "xxxtest@example.com"), None)

		frappe.db.set_value("Website Settings", "Website Settings", "_test", "_test_val")
		self.assertEquals(frappe.db.get_value("Website Settings", None, "_test"), "_test_val")
		self.assertEquals(frappe.db.get_value("Website Settings", "Website Settings", "_test"), "_test_val")
