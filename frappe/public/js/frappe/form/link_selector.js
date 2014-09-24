// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.ui.form.LinkSelector = Class.extend({
	_help: "Dialog box to select a Link Value",
	init: function(opts) {
		/* help: Options: doctype, get_query, target */
		$.extend(this, opts);
		
		var me = this;
		if(this.doctype!="[Select]") {
			frappe.model.with_doctype(this.doctype, function(r) {
				me.make();
			});
		} else {
			this.make();
		}
	},
	make: function() {
		this.dialog = new frappe.ui.Dialog({
			"title": "Select " + (this.doctype=='[Select]' ? "Value" : this.doctype),
			"fields": [
				{
					fieldtype: "Data", fieldname: "txt", label: "Beginning with",
					description: "You can use wildcard %",
				},
				{
					fieldtype: "Select", fieldname: "search_field", label: "Search With"
				},
				{
					fieldtype: "Button", fieldname: "search", label: "Search",
				},
				{
					fieldtype: "HTML", fieldname: "results"
				}
			]
		});
		var search_fields = frappe.model.get_value("DocType", this.doctype, "search_fields"),
			me = this;
		
		// add search fields
		if(this.doctype!="[Select]" && search_fields) {
			var search_fields = search_fields.split(",");
			
			this.dialog.fields_dict.search_field.$input.add_options(
				[{value:"name", label:"ID"}].concat(
				$.map(search_fields, function(fieldname) {
					fieldname = strip(fieldname);
					var df = frappe.meta.docfield_map[me.doctype][fieldname];
					return {
						value: fieldname, 
						label: df ? df.label : fieldname
					}
				})));
		} else {
			this.dialog.fields_dict.search_field.$wrapper.toggle(false);
		}
		if(this.txt)
			this.dialog.fields_dict.txt.set_input(this.txt);
		this.dialog.fields_dict.search.$input.on("click", function() {
			me.search(this);
		});
		this.dialog.show();
	},
	search: function(btn) {
		var args = {
				txt: this.dialog.fields_dict.txt.get_value(),
				doctype: this.doctype,
				searchfield: this.dialog.fields_dict.search_field.get_value() || "name"
			},
			me = this;

		this.target.set_custom_query(args);
		
		return frappe.call({
			method: "frappe.widgets.search.search_widget",
			type: "GET",
			args: args,
			callback: function(r) {
				var parent = me.dialog.fields_dict.results.$wrapper;
				parent.empty();
				if(r.values.length) {
					$.each(r.values, function(i, v) {
						var row = $(repl('<p><a href="#" data-value="%(name)s">%(name)s</a> \
							<span class="text-muted">%(values)s</span></p>', {
								name: v[0],
								values: v.splice(1).join(", ")
							})).appendTo(parent);
						
						row.find("a").click(function() {
							var value = $(this).attr("data-value");
							if(me.target.doctype) 
								me.target.parse_validate_and_set_in_model(value);
							else {
								me.target.set_input(value);
								me.target.$input.trigger("change");
							}
							me.dialog.hide();
							return false;
						})
					})
				} else {
					$('<div class="alert alert-info">' + __("No Results")  
						+ (frappe.model.can_read(me.doctype) ? 
							('. <a class="new-doc">'
							+ __("Make a new") + " " + __(me.doctype) + "</a>") : '') 
						+ '</div>').appendTo(parent).find(".new-doc").click(function() {
							cur_frm.new_doc(me.doctype, me.target);
						});
				}
			}, 
			btn: btn
		});
	}
})