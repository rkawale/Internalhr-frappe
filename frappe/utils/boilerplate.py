# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals

import frappe, os
from frappe.utils import touch_file

def make_boilerplate(dest):
	if not os.path.exists(dest):
		print "Destination directory does not exist"
		return

	hooks = frappe._dict()
	for key in ("App Name", "App Title", "App Description", "App Publisher",
		"App Icon", "App Color", "App Email", "App URL", "App License"):
		hook_key = key.lower().replace(" ", "_")
		hook_val = None
		while not hook_val:
			hook_val = raw_input(key + ": ")
			if hook_key=="app_name" and hook_val.lower().replace(" ", "_") != hook_val:
				print "App Name must be all lowercase and without spaces"
				hook_val = ""

		hooks[hook_key] = hook_val

	frappe.create_folder(os.path.join(dest, hooks.app_name, hooks.app_name, hooks.app_name))
	frappe.create_folder(os.path.join(dest, hooks.app_name, hooks.app_name, "templates"))
	frappe.create_folder(os.path.join(dest, hooks.app_name, hooks.app_name, "templates",
		"statics"))
	frappe.create_folder(os.path.join(dest, hooks.app_name, hooks.app_name, "templates",
		"pages"))
	frappe.create_folder(os.path.join(dest, hooks.app_name, hooks.app_name, "templates",
		"generators"))
	frappe.create_folder(os.path.join(dest, hooks.app_name, hooks.app_name, "config"))

	# init files
	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, "__init__.py"))
	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, hooks.app_name, "__init__.py"))
	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, "templates", "__init__.py"))
	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, "templates",
		"pages", "__init__.py"))
	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, "templates",
		"generators", "__init__.py"))
	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, "config", "__init__.py"))

	with open(os.path.join(dest, hooks.app_name, "MANIFEST.in"), "w") as f:
		f.write(manifest_template.format(**hooks))

	with open(os.path.join(dest, hooks.app_name, ".gitignore"), "w") as f:
		f.write(gitignore_template)

	with open(os.path.join(dest, hooks.app_name, "setup.py"), "w") as f:
		f.write(setup_template.format(**hooks))

	with open(os.path.join(dest, hooks.app_name, "requirements.txt"), "w") as f:
		f.write("frappe")

	touch_file(os.path.join(dest, hooks.app_name, "README.md"))

	with open(os.path.join(dest, hooks.app_name, "license.txt"), "w") as f:
		f.write("License: " + hooks.app_license)

	with open(os.path.join(dest, hooks.app_name, hooks.app_name, "modules.txt"), "w") as f:
		f.write(hooks.app_name)

	with open(os.path.join(dest, hooks.app_name, hooks.app_name, "hooks.py"), "w") as f:
		f.write(hooks_template.format(**hooks))

	touch_file(os.path.join(dest, hooks.app_name, hooks.app_name, "patches.txt"))

	with open(os.path.join(dest, hooks.app_name, hooks.app_name, "config", "desktop.py"), "w") as f:
		f.write(desktop_template.format(**hooks))




manifest_template = """include MANIFEST.in
include requirements.txt
include *.json
include *.md
include *.py
include *.txt
recursive-include {app_name} *.css
recursive-include {app_name} *.csv
recursive-include {app_name} *.html
recursive-include {app_name} *.ico
recursive-include {app_name} *.js
recursive-include {app_name} *.json
recursive-include {app_name} *.md
recursive-include {app_name} *.png
recursive-include {app_name} *.py
recursive-include {app_name} *.svg
recursive-include {app_name} *.txt
recursive-exclude {app_name} *.pyc"""

hooks_template = """app_name = "{app_name}"
app_title = "{app_title}"
app_publisher = "{app_publisher}"
app_description = "{app_description}"
app_icon = "{app_icon}"
app_color = "{app_color}"
app_email = "{app_email}"
app_url = "{app_url}"
app_version = "0.0.1"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/{app_name}/css/{app_name}.css"
# app_include_js = "/assets/{app_name}/js/{app_name}.js"

# include js, css files in header of web template
# web_include_css = "/assets/{app_name}/css/{app_name}.css"
# web_include_js = "/assets/{app_name}/js/{app_name}.js"

# Installation
# ------------

# before_install = "{app_name}.install.before_install"
# after_install = "{app_name}.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "{app_name}.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {{
# 	"Event": "frappe.core.doctype.event.event.get_permission_query_conditions",
# }}
#
# has_permission = {{
# 	"Event": "frappe.core.doctype.event.event.has_permission",
# }}

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {{
# 	"*": {{
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}}
# }}

# Scheduled Tasks
# ---------------

# scheduler_events = {{
# 	"all": [
# 		"{app_name}.tasks.all"
# 	],
# 	"daily": [
# 		"{app_name}.tasks.daily"
# 	],
# 	"hourly": [
# 		"{app_name}.tasks.hourly"
# 	],
# 	"weekly": [
# 		"{app_name}.tasks.weekly"
# 	]
# 	"monthly": [
# 		"{app_name}.tasks.monthly"
# 	]
# }}

# Testing
# -------

# before_tests = "{app_name}.install.before_tests"

"""

desktop_template = """from frappe import _

data = {{
	"{app_title}": {{
		"color": "{app_color}",
		"icon": "{app_icon}",
		"label": _("{app_title}")
	}}
}}
"""

setup_template = """from setuptools import setup, find_packages
import os

version = '0.0.1'

setup(
    name='{app_name}',
    version=version,
    description='{app_description}',
    author='{app_publisher}',
    author_email='{app_email}',
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=("frappe",),
)
"""

gitignore_template = """.DS_Store
*.pyc
*.egg-info
*.swp
tags"""
