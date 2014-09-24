// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// for license information please see license.txt

frappe.provide("frappe.form.formatters");

frappe.form.formatters = {
	Data: function(value) {
		return value==null ? "" : value
	},
	Float: function(value, docfield) {
		var decimals = cint(docfield.options, null) || cint(frappe.boot.sysdefaults.float_precision, null);

		return "<div style='text-align: right'>" + 
			((value==null || value==="") ? "" :
				format_number(value, null, decimals)) + "</div>";
	},
	Int: function(value) {
		return value==null ? "": "<div style='text-align: right'>" + cint(value) + "</div>";
	},
	Percent: function(value) {
		return "<div style='text-align: right'>" + flt(value, 2) + "%" + "</div>";
	},
	Currency: function(value, docfield, options, doc) {
		var currency = frappe.meta.get_field_currency(docfield, doc);
		return "<div style='text-align: right'>" + format_currency(value, currency) + "</div>";
	},
	Check: function(value) {
		return value ? "<i class='icon-check'></i>" : "<i class='icon-check-empty'></i>";
	},
	Link: function(value, docfield, options) {
		if(options && options.for_print) 
			return value;
		if(!value) 
			return "";
		if(docfield && docfield.link_onclick) {
			return repl('<a onclick="%(onclick)s">%(value)s</a>', 
				{onclick: docfield.link_onclick.replace(/"/g, '&quot;'), value:value});
		} else if(docfield && docfield.options) {
			return repl('%(icon)s<a href="#Form/%(doctype)s/%(name)s">%(label)s</a>', {
				doctype: encodeURIComponent(docfield.options),
				name: encodeURIComponent(value),
				label: value,
				icon: (options && options.no_icon) ? "" :
					('<i class="icon-fixed-width '+frappe.boot.doctype_icons[docfield.options]+'"></i> ')
			});
		} else {
			return value;
		}
	},
	Date: function(value) {
		return value ? dateutil.str_to_user(value) : "";
	},
	Text: function(value) {
		if(value) {
			var tags = ["<p[^>]>", "<div[^>]>", "<br[^>]>"];
			var match = false;

			for(var i=0; i<tags.length; i++) {
				if(value.match(tags[i])) {
					match = true;
				}
			}

			if(!match) {
				return replace_newlines(value);
			}
		}

		return frappe.form.formatters.Data(value);
	},
	Tag: function(value) {
		var html = "";
		$.each((value || "").split(","), function(i, v) {
			if(v) html+= '<span class="label label-info" \
				style="margin-right: 7px; cursor: pointer;"\
				data-field="_user_tags" data-label="'+v+'">'+v +'</span>';
		});
		return html;
	},
	Comment: function(value) {
		var html = "";
		$.each(JSON.parse(value || "[]"), function(i, v) {
			if(v) html+= '<span class="label label-warning" \
				style="margin-right: 7px;"\
				data-field="_comments" data-label="'+v.name+'">'+v.comment+'</span>';
		});
		return html;
	},
	SmallText: function(value) {
		return frappe.form.formatters.Text(value);
	},
	TextEditor: function(value) {
		return frappe.form.formatters.Text(frappe.utils.remove_script_and_style(value));
	},
	Code: function(value) {
		return "<pre>" + (value==null ? "" : $("<div>").text(value).html()) + "</pre>"
	},
	WorkflowState: function(value) {
		workflow_state = frappe.get_doc("Workflow State", value);
		if(workflow_state) {
			return repl("<span class='label label-%(style)s' \
				data-workflow-state='%(value)s'\
				style='padding-bottom: 4px; cursor: pointer;'>\
				<i class='icon-small icon-white icon-%(icon)s'></i> %(value)s</span>", {
					value: value,
					style: workflow_state.style.toLowerCase(),
					icon: workflow_state.icon
				});
		} else {
			return "<span class='label'>" + value + "</span>";
		}
	}
}

frappe.form.get_formatter = function(fieldtype) {
	if(!fieldtype) fieldtype = "Data";
	return frappe.form.formatters[fieldtype.replace(/ /g, "")] || frappe.form.formatters.Data;
}

frappe.format = function(value, df, options, doc) {
	if(!df) df = {"fieldtype":"Data"};
	return frappe.form.get_formatter(df.fieldtype)(value, df, options, doc);
}