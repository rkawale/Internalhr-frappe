# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

"""Use blog post test to test permission restriction logic"""

import frappe
import frappe.defaults
import unittest

test_records = frappe.get_test_records('Event')

class TestEvent(unittest.TestCase):
	# def setUp(self):
	# 	user = frappe.get_doc("User", "test1@example.com")
	# 	user.add_roles("Website Manager")

	def tearDown(self):
		frappe.set_user("Administrator")

	def test_allowed_public(self):
		frappe.set_user("test1@example.com")
		doc = frappe.get_doc("Event", frappe.db.get_value("Event", {"subject":"_Test Event 1"}))
		self.assertTrue(frappe.has_permission("Event", doc=doc))

	def test_not_allowed_private(self):
		frappe.set_user("test1@example.com")
		doc = frappe.get_doc("Event", frappe.db.get_value("Event", {"subject":"_Test Event 2"}))
		self.assertFalse(frappe.has_permission("Event", doc=doc))

	def test_allowed_private_if_in_event_user(self):
		frappe.set_user("test1@example.com")
		doc = frappe.get_doc("Event", frappe.db.get_value("Event", {"subject":"_Test Event 3"}))
		self.assertTrue(frappe.has_permission("Event", doc=doc))

	def test_event_list(self):
		frappe.set_user("test1@example.com")
		res = frappe.get_list("Event", filters=[["Event", "subject", "like", "_Test Event%"]], fields=["name", "subject"])
		self.assertEquals(len(res), 2)
		subjects = [r.subject for r in res]
		self.assertTrue("_Test Event 1" in subjects)
		self.assertTrue("_Test Event 3" in subjects)
		self.assertFalse("_Test Event 2" in subjects)
