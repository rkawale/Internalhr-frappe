# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt 

from __future__ import unicode_literals

no_cache = 1
no_sitemap = 1
base_template_path = "templates/pages/print.html"

def get_context(context):
	from frappe.core.doctype.print_format.print_format import get_args
	return get_args()