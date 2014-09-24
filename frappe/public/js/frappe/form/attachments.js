// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.provide("frappe.ui.form");

frappe.ui.form.Attachments = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.make();
	},
	make: function() {
		var me = this;
		this.wrapper = $('<div>\
			<div class="attachment-list"></div>\
		</div>').appendTo(this.parent);
		this.$list = this.wrapper.find(".attachment-list");

		this.parent.find(".btn").click(function() {
			me.new_attachment();
		});
	},
	max_reached: function() {
		// no of attachments
		var n = keys(this.get_attachments()).length;

		// button if the number of attachments is less than max
		if(n < this.frm.meta.max_attachments || !this.frm.meta.max_attachments) {
			return false;
		}
		return true;
	},
	refresh: function() {
		var doc = this.frm.doc;
		if(doc.__islocal) {
			this.parent.toggle(false);
			return;
		}
		this.parent.toggle(true);
		this.parent.find(".btn").toggle(!this.max_reached());

		this.$list.empty();

		var attachments = this.get_attachments();
		var that = this;


		// add attachment objects
		if(attachments.length) {
			attachments.forEach(function(attachment) {
				that.add_attachment(attachment)
			});
		} else {
			$('<p class="text-muted">' + __("None") + '</p>').appendTo(this.$list);
		}

		// refresh select fields with options attach_files:
		this.refresh_attachment_select_fields();
	},
	get_attachments: function() {
		return this.frm.get_docinfo().attachments;
	},
	add_attachment: function(attachment) {
		var file_name = attachment.file_name;
		var file_url = attachment.file_url;
		var fileid = attachment.name;
		if (!file_name) {
			file_name = file_url;
		}

		var me = this;
		var $attach = $(repl('<div class="alert alert-info" style="margin-bottom: 7px">\
			<span style="display: inline-block; width: 90%; \
				text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">\
				<i class="icon-file"></i> <a href="%(file_url)s"\
					target="_blank" title="%(file_name)s">%(file_name)s</a></span><a href="#" class="close">&times;</a>\
			</div>', {
				file_name: file_name,
				file_url: file_url
			}))
			.appendTo(this.$list)

		var $close =
			$attach.find(".close")
			.data("fileid", fileid)
			.click(function() {
				var remove_btn = this;
				frappe.confirm(__("Are you sure you want to delete the attachment?"),
					function() {
						me.remove_attachment($(remove_btn).data("fileid"))
					}
				);
				return false
			});

		if(!frappe.model.can_write(this.frm.doctype, this.frm.name)) {
			$close.remove();
		}
	},
	remove_attachment_by_filename: function(filename, callback) {
		this.remove_attachment(this.get_attachments()[filename], callback);
	},
	remove_attachment: function(fileid, callback) {
		var me = this;
		return frappe.call({
			method: 'frappe.widgets.form.utils.remove_attach',
			args: {
				fid: fileid,
				dt: me.frm.doctype,
				dn: me.frm.docname
			},
			callback: function(r,rt) {
				if(r.exc) {
					if(!r._server_messages)
						msgprint(__("There were errors"));
					return;
				}
				me.remove_fileid(fileid);
				me.frm.toolbar.show_infobar();
				if(callback) callback();
			}
		});
	},
	new_attachment: function(fieldname) {
		var me = this;
		if(!this.dialog) {
			this.dialog = new frappe.ui.Dialog({
				title: __('Upload Attachment'),
			});
		}
		this.dialog.show();

		$(this.dialog.body).empty();
		frappe.upload.make({
			parent: this.dialog.body,
			args: {
				from_form: 1,
				doctype: this.frm.doctype,
				docname: this.frm.docname,
			},
			callback: function(attachment, r) {
				me.dialog.hide();
				me.update_attachment(attachment);
				if(fieldname) this.frm.set_value(fieldname, attachment.file_url);
			},
			onerror: function() {
				me.dialog.hide();
			},
			max_width: this.frm.cscript ? this.frm.cscript.attachment_max_width : null,
			max_height: this.frm.cscript ? this.frm.cscript.attachment_max_height : null,
		});
	},
	update_attachment: function(attachment, fieldname) {
		if(attachment.name) {
			this.add_to_attachments(attachment);
			this.refresh();
			this.frm.toolbar.show_infobar();
		}
	},
	add_to_attachments: function (attachment) {
		var form_attachments = this.get_attachments();
		for(var i in form_attachments) {
			// prevent duplicate
			if(form_attachments[i]["name"] === attachment.name) return;
		}
		form_attachments.push(attachment);
	},
	remove_fileid: function(fileid) {
		var attachments = this.get_attachments();
		var new_attachments = [];
		$.each(attachments, function(i, attachment) {
			if(attachment.name!=fileid) {
				new_attachments.push(attachment);
			}
		});
		this.frm.get_docinfo().attachments = new_attachments;
		this.refresh();
	},
	refresh_attachment_select_fields: function() {
		for(var i=0; i<this.frm.fields.length; i++) {
			if(this.frm.fields[i].df.options=="attach_files:" && this.frm.fields[i].$input) {
				var fieldname = this.frm.fields[i].df.fieldname;
				var selected_option = this.frm.fields[i].$input.find("option:selected").val();

				if(this.frm.doc[fieldname]!=null && selected_option!==this.frm.doc[fieldname]) {
					this.frm.script_manager.trigger(fieldname);
					this.frm.set_value(fieldname, "");
				}

				this.frm.fields[i].refresh();
			}
		}
	}
});
