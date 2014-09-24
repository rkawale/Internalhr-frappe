# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe, pytz
from frappe import _
from frappe.model.document import Document
from frappe.translate import get_lang_dict, set_default_language
from frappe.utils import cint

class SystemSettings(Document):
	def validate(self):
		if self.session_expiry:
			parts = self.session_expiry.split(":")
			if len(parts)!=2 or not (cint(parts[0]) or cint(parts[1])):
				frappe.throw(_("Session Expiry must be in format {0}").format("hh:mm"))

	def on_update(self):
		for df in self.meta.get("fields"):
			if df.fieldtype in ("Select", "Data"):
				frappe.db.set_default(df.fieldname, self.get(df.fieldname))

		set_default_language(self.language)


@frappe.whitelist()
def load():
	if not "System Manager" in frappe.get_roles():
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	all_defaults = frappe.db.get_defaults()
	defaults = {}

	for df in frappe.get_meta("System Settings").get("fields"):
		if df.fieldtype in ("Select", "Data"):
			defaults[df.fieldname] = all_defaults.get(df.fieldname)

	languages = get_lang_dict().keys()
	languages.sort()

	return {
		"timezones": pytz.all_timezones,
		"languages": [""] + languages,
		"defaults": defaults
	}
