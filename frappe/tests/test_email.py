# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import os, sys

import unittest, frappe

from frappe.test_runner import make_test_records
make_test_records("User")

class TestEmail(unittest.TestCase):
	def setUp(self):
		frappe.db.sql("""update tabUser set unsubscribed=0""")
		frappe.db.sql("""delete from `tabBulk Email`""")
		
	def test_send(self):
		from frappe.utils.email_lib import sendmail
		#sendmail('test@example.com', subject='Test Mail', msg="Test Content")

	def test_bulk(self):
		from frappe.utils.email_lib.bulk import send
		send(recipients = ['test@example.com', 'test1@example.com'], 
			sender="admin@example.com",
			doctype='User', email_field='email',
			subject='Testing Bulk', message='This is a bulk mail!')
		
		bulk = frappe.db.sql("""select * from `tabBulk Email` where status='Not Sent'""", as_dict=1)
		self.assertEquals(len(bulk), 2)
		self.assertTrue('test@example.com' in [d['recipient'] for d in bulk])
		self.assertTrue('test1@example.com' in [d['recipient'] for d in bulk])
		self.assertTrue('Unsubscribe' in bulk[0]['message'])

	def test_flush(self):
		self.test_bulk()
		from frappe.utils.email_lib.bulk import flush
		flush(from_test=True)
		bulk = frappe.db.sql("""select * from `tabBulk Email` where status='Sent'""", as_dict=1)
		self.assertEquals(len(bulk), 2)
		self.assertTrue('test@example.com' in [d['recipient'] for d in bulk])
		self.assertTrue('test1@example.com' in [d['recipient'] for d in bulk])
		
	def test_unsubscribe(self):
		from frappe.utils.email_lib.bulk import unsubscribe, send
		frappe.local.form_dict = {
			'email':'test@example.com',
			'type':'User',
			'email_field':'email',
			"from_test": True
		}
		unsubscribe()

		send(recipients = ['test@example.com', 'test1@example.com'], 
			sender="admin@example.com",
			doctype='User', email_field='email', 
			subject='Testing Bulk', message='This is a bulk mail!')
		
		bulk = frappe.db.sql("""select * from `tabBulk Email` where status='Not Sent'""", 
			as_dict=1)
		self.assertEquals(len(bulk), 1)
		self.assertFalse('test@example.com' in [d['recipient'] for d in bulk])
		self.assertTrue('test1@example.com' in [d['recipient'] for d in bulk])
		self.assertTrue('Unsubscribe' in bulk[0]['message'])
	
	def test_bulk_limit(self):
		from frappe.utils.email_lib.bulk import unsubscribe, send, BulkLimitCrossedError
		self.assertRaises(BulkLimitCrossedError, send,
			recipients=['test@example.com']*1000,
			sender="admin@example.com",
			doctype='User', email_field='email',
			subject='Testing Bulk', message='This is a bulk mail!')
		
		
if __name__=='__main__':
	frappe.connect()
	unittest.main()