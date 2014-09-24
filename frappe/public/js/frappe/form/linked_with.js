// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.provide("frappe.ui.form");

frappe.ui.form.LinkedWith = Class.extend({
	init: function(opts) {
		var me = this;
		$.extend(this, opts);
	},
	show: function() {
		if(!this.dialog)
			this.make_dialog();
		
		this.dialog.show();
	},
	make_dialog: function() {
		var me = this;
		this.linked_with = this.frm.meta.__linked_with;

		var links = [];
		$.each(this.linked_with, function(doctype, tmp) {
			if(frappe.model.can_get_report(doctype)) {
				links.push({label: __(doctype), value: doctype});
			}
		});
		
		links = frappe.utils.sort(links, "label");
				
		this.dialog = new frappe.ui.Dialog({
			width: 700,
			hide_on_page_refresh: true,
			title: __("Linked With"),
			fields: [
				{ fieldtype: "HTML", label: "list" }
			]
		});
				
		if(!links) {
			this.dialog.fields_dict.list.$wrapper.html("<div class='alert alert-warning'>"
			+ this.frm.doctype + ": "
			+ (this.linked_with ? __("Not Linked to any record.") : __("Not enough permission to see links."))
			+ "</div>")
			return;
		}
		
		this.dialog.onshow = function() {
			me.dialog.fields_dict.list.$wrapper.html('<div class="progress progress-striped active">\
					<div class="progress-bar" style="width: 100%;">\
					</div></div>');
			
			frappe.call({
				method:"frappe.widgets.form.utils.get_linked_docs",
				args: {
					doctype: me.frm.doctype,
					name: me.frm.docname,
					metadata_loaded: keys(locals.DocType)
				},
				callback: function(r) {
					var parent = me.dialog.fields_dict.list.$wrapper.empty();

					if(keys(r.message || {}).length) {
						$.each(keys(r.message).sort(), function(i, doctype) {							
							var listview = frappe.views.get_listview(doctype, me);
							listview.no_delete = true;
							
							var wrapper = $('<div class="panel panel-default"><div>').appendTo(parent);
							$('<div class="panel-heading">').html(__(doctype).bold()).appendTo(wrapper);
							var body = $('<div class="panel-body">').appendTo(wrapper)
								.css({"padding-top": "0px", "padding-bottom": "0px"});
							
							$.each(r.message[doctype], function(i, d) {
								d.doctype = doctype;
								listview.render($("<div>")
									.appendTo(body), d, me);
							})
						})
					} else {
						parent.html(__("Not Linked to any record."));
					}
				}
			})
		}
		
	},
});