# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

# metadata

from __future__ import unicode_literals
import frappe, os
from frappe.utils import cstr, cint
from frappe.model.meta import Meta
from frappe.modules import scrub, get_module_path
from frappe.model.workflow import get_workflow_name

######

def get_meta(doctype, cached=True):
	if cached:
		meta = frappe.cache().get_value("form_meta:" + doctype, lambda: FormMeta(doctype))
	else:
		meta = FormMeta(doctype)

	if frappe.local.lang != 'en':
		meta.set("__messages", frappe.get_lang_dict("doctype", doctype))

	return meta

class FormMeta(Meta):
	def __init__(self, doctype):
		super(FormMeta, self).__init__(doctype)
		self.load_assets()

	def load_assets(self):
		self.expand_selects()
		self.add_search_fields()

		if not self.istable:
			self.add_linked_with()
			self.add_code()
			self.load_print_formats()
			self.load_workflows()

	def as_dict(self, no_nulls=False):
		d = super(FormMeta, self).as_dict(no_nulls=no_nulls)
		for k in ("__js", "__css", "__list_js", "__calendar_js", "__map_js", "__linked_with", "__messages"):
			d[k] = self.get(k)

		for i, df in enumerate(d.get("fields")):
			for k in ("link_doctype", "search_fields"):
				df[k] = self.get("fields")[i].get(k)

		return d

	def add_code(self):
		path = os.path.join(get_module_path(self.module), 'doctype', scrub(self.name))
		def _get_path(fname):
			return os.path.join(path, scrub(fname))

		self._add_code(_get_path(self.name + '.js'), '__js')
		self._add_code(_get_path(self.name + '.css'), "__css")
		self._add_code(_get_path(self.name + '_list.js'), '__list_js')
		self._add_code(_get_path(self.name + '_calendar.js'), '__calendar_js')
		self._add_code(_get_path(self.name + '_map.js'), '__map_js')

		self.add_custom_script()
		self.add_code_via_hook("doctype_js", "__js")

	def _add_code(self, path, fieldname):
		js = frappe.read_file(path)
		if js:
			self.set(fieldname, (self.get(fieldname) or "") + "\n\n" + render_jinja(js))

	def add_code_via_hook(self, hook, fieldname):
		hook = "{}:{}".format(hook, self.name)
		for app_name in frappe.get_installed_apps():
			for file in frappe.get_hooks(hook, app_name=app_name):
				path = frappe.get_app_path(app_name, *file.strip("/").split("/"))
				self._add_code(path, fieldname)

	def add_custom_script(self):
		"""embed all require files"""
		# custom script
		custom = frappe.db.get_value("Custom Script", {"dt": self.name,
			"script_type": "Client"}, "script") or ""

		self.set("__js", (self.get('__js') or '') + "\n\n" + custom)

	def render_jinja(content):
		if "{% include" in content:
			content = frappe.get_jenv().from_string(content).render()
		return content

	def expand_selects(self):
		for df in self.get("fields", {"fieldtype": "Select"}):
			if df.options and df.options.startswith("link:"):
				df.link_doctype = df.options.split("\n")[0][5:]
				df.options = '\n'.join([''] + [o.name for o in frappe.db.sql("""select
					name from `tab%s` where docstatus<2 order by name asc""" % df.link_doctype, as_dict=1)])

	def add_search_fields(self):
		"""add search fields found in the doctypes indicated by link fields' options"""
		for df in self.get("fields", {"fieldtype": "Link", "options":["!=", "[Select]"]}):
			if df.options:
				search_fields = frappe.get_meta(df.options).search_fields
				if search_fields:
					df.search_fields = map(lambda sf: sf.strip(), search_fields.split(","))

	def add_linked_with(self):
		"""add list of doctypes this doctype is 'linked' with"""
		links = frappe.db.sql("""select parent, fieldname from tabDocField
			where (fieldtype="Link" and options=%s)
			or (fieldtype="Select" and options=%s)""", (self.name, "link:"+ self.name))
		links += frappe.db.sql("""select dt as parent, fieldname from `tabCustom Field`
			where (fieldtype="Link" and options=%s)
			or (fieldtype="Select" and options=%s)""", (self.name, "link:"+ self.name))

		links = dict(links)

		if not links:
			return {}

		ret = {}

		for dt in links:
			ret[dt] = { "fieldname": links[dt] }

		for grand_parent, options in frappe.db.sql("""select parent, options from tabDocField
			where fieldtype="Table"
				and options in (select name from tabDocType
					where istable=1 and name in (%s))""" % ", ".join(["%s"] * len(links)) ,tuple(links)):

			ret[grand_parent] = {"child_doctype": options, "fieldname": links[options] }
			if options in ret:
				del ret[options]

		self.set("__linked_with", ret)

	def load_print_formats(self):
		frappe.response.docs.extend(frappe.db.sql("""select * FROM `tabPrint Format`
			WHERE doc_type=%s AND docstatus<2""", (self.name,), as_dict=1, update={"doctype":"Print Format"}))

	def load_workflows(self):
		# get active workflow
		workflow_name = get_workflow_name(self.name)

		if workflow_name and frappe.db.exists("Workflow", workflow_name):
			workflow = frappe.get_doc("Workflow", workflow_name)
			frappe.response.docs.append(workflow)

			for d in workflow.get("workflow_document_states"):
				frappe.response.docs.append(frappe.get_doc("Workflow State", d.state))


def render_jinja(content):
	if "{% include" in content:
		content = frappe.get_jenv().from_string(content).render()
	return content

