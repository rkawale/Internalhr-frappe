# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe

common_keys = ["__default", "__global"]

def set_user_default(key, value, user=None, parenttype=None):
	set_default(key, value, user or frappe.session.user, parenttype)

def add_user_default(key, value, user=None, parenttype=None):
	add_default(key, value, user or frappe.session.user, parenttype)

def get_user_default(key, user=None):
	d = get_defaults(user or frappe.session.user).get(key, None)
	return isinstance(d, list) and d[0] or d

def get_user_default_as_list(key, user=None):
	d = get_defaults(user or frappe.session.user).get(key, None)
	return (not isinstance(d, list)) and [d] or d

def get_restrictions(user=None):
	if not user:
		user = frappe.session.user

	if user == frappe.session.user:
		if frappe.local.restrictions is None:
			frappe.local.restrictions = build_restrictions(user)
		return frappe.local.restrictions
	else:
		return build_restrictions(user)

def build_restrictions(user):
	out = frappe.cache().get_value("restrictions:" + user)
	if out==None:
		out = {}
		for key, value in frappe.db.sql("""select defkey, defvalue
			from tabDefaultValue where parent=%s and parenttype='Restriction'""", (user,)):
			out.setdefault(key, [])
			out[key].append(value)
		frappe.cache().set_value("restrictions:" + user, out)
	return out

def get_defaults(user=None):
	if not user:
		user = frappe.session.user if frappe.session else "Guest"

	userd = get_defaults_for(user)
	userd.update({"user": user, "owner": user})

	globald = get_defaults_for()
	globald.update(userd)

	return globald

def clear_user_default(key, user=None):
	clear_default(key, parent=user or frappe.session.user)

# Global

def set_global_default(key, value):
	set_default(key, value, "__default")

def add_global_default(key, value):
	add_default(key, value, "__default")

def get_global_default(key):
	d = get_defaults().get(key, None)
	return isinstance(d, list) and d[0] or d

# Common

def set_default(key, value, parent, parenttype="__default"):
	if frappe.db.sql("""select defkey from `tabDefaultValue` where
		defkey=%s and parent=%s """, (key, parent)):
		# update
		frappe.db.sql("""update `tabDefaultValue` set defvalue=%s, parenttype=%s
			where parent=%s and defkey=%s""", (value, parenttype, parent, key))
		_clear_cache(parent)
	else:
		add_default(key, value, parent)

def add_default(key, value, parent, parenttype=None):
	d = frappe.get_doc({
		"doctype": "DefaultValue",
		"parent": parent,
		"parenttype": parenttype or "__default",
		"parentfield": "system_defaults",
		"defkey": key,
		"defvalue": value
	})
	d.db_insert()
	if parenttype=="Restriction":
		frappe.local.restrictions = None
	_clear_cache(parent)

def clear_default(key=None, value=None, parent=None, name=None, parenttype=None):
	conditions = []
	values = []

	if key:
		conditions.append("defkey=%s")
		values.append(key)

	if value:
		conditions.append("defvalue=%s")
		values.append(value)

	if name:
		conditions.append("name=%s")
		values.append(name)

	if parent:
		conditions.append("parent=%s")
		clear_cache(parent)
		values.append(parent)
	else:
		clear_cache("__default")
		clear_cache("__global")

	if parenttype:
		conditions.append("parenttype=%s")
		values.append(parenttype)
		if parenttype=="Restriction":
			frappe.local.restrictions = None

	if not conditions:
		raise Exception, "[clear_default] No key specified."

	frappe.db.sql("""delete from tabDefaultValue where {0}""".format(" and ".join(conditions)),
		tuple(values))
	_clear_cache(parent)

def get_defaults_for(parent="__default"):
	"""get all defaults"""
	defaults = frappe.cache().get_value("__defaults:" + parent)
	if defaults==None:
		res = frappe.db.sql("""select defkey, defvalue from `tabDefaultValue`
			where parent = %s order by creation""", (parent,), as_dict=1)

		defaults = frappe._dict({})
		for d in res:
			if d.defkey in defaults:
				# listify
				if not isinstance(defaults[d.defkey], list) and defaults[d.defkey] != d.defvalue:
					defaults[d.defkey] = [defaults[d.defkey]]

				if d.defvalue not in defaults[d.defkey]:
					defaults[d.defkey].append(d.defvalue)
			elif d.defvalue is not None:
				defaults[d.defkey] = d.defvalue

		frappe.cache().set_value("__defaults:" + parent, defaults)

	return defaults

def _clear_cache(parent):
	if parent in common_keys:
		frappe.clear_cache()
	else:
		frappe.clear_cache(user=parent)

def clear_cache(user=None):
	to_clear = []
	if user:
		to_clear = [user]
	elif frappe.flags.in_install_app!="frappe":
		try:
			to_clear = frappe.db.sql_list("select name from tabUser")
		except Exception, e:
			if e.args[0]!=1146:
				# special case, in rename patch
				raise
	for p in (to_clear + common_keys):
		frappe.cache().delete_value("__defaults:" + p)
