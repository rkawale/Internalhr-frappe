# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe

@frappe.whitelist()
def get_app_list():
	out = {}
	installed = frappe.get_installed_apps()
	for app in frappe.get_all_apps(True):
		app_hooks = frappe.get_hooks(app_name=app)

		if app_hooks.get('hide_in_installer'):
			continue

		out[app] = {}
		for key in ("app_name", "app_title", "app_description", "app_icon",
			"app_publisher", "app_version", "app_url", "app_color"):
			 val = app_hooks.get(key) or []
			 out[app][key] = val[0] if len(val) else ""
			
		if app in installed:
			out[app]["installed"] = 1
		
	return out
