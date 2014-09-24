# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt 

from __future__ import unicode_literals
import frappe
import os, urllib
from frappe.utils import escape_html, get_request_site_address, now, cstr

no_cache = 1
base_template_path = "templates/pages/rss.xml"

def get_context(context):
	"""generate rss feed"""
		
	host = get_request_site_address()
	
	blog_list = frappe.db.sql("""\
		select page_name as name, published_on, modified, title, content from `tabBlog Post` 
		where ifnull(published,0)=1
		order by published_on desc limit 20""", as_dict=1)

	for blog in blog_list:
		blog_page = cstr(urllib.quote(blog.name.encode("utf-8"))) + ".html"
		blog.link = urllib.basejoin(host, blog_page)
		blog.content = escape_html(blog.content or "")
	
	if blog_list:
		modified = max((blog['modified'] for blog in blog_list))
	else:
		modified = now()

	ws = frappe.get_doc('Website Settings', 'Website Settings')

	context = {
		'title': ws.title_prefix,
		'description': ws.description or ((ws.title_prefix or "") + ' Blog'),
		'modified': modified,
		'items': blog_list,
		'link': host + '/blog'
	}
	
	# print context
	return context
	