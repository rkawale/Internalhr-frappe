// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.ui.form.InfoBar = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.make();
		this.refresh();
	},
	make: function() {
		var me = this;

		this.appframe.iconbar.clear(2);
		this.$reload = this.appframe.add_icon_btn("2", "icon-refresh", __("Reload Page"),
			function() { me.frm.reload_doc(); })


		this.$timestamp = this.appframe.add_icon_btn("2", "icon-user", __("Creation / Modified By"),
			function() { })

		this.$comments = this.appframe.add_icon_btn("2", "icon-comments", __("Comments"), function() {
				me.scroll_to(".form-comments");
			});

		this.$attachments = this.appframe.add_icon_btn("2", "icon-paper-clip", __("Attachments"),  function() {
				me.scroll_to(".form-attachments");
			});

		this.$assignments = this.appframe.add_icon_btn("2", "icon-flag", __("Assignments"),  function() {
				me.scroll_to(".form-attachments");
			});


		this.$links = this.appframe.add_icon_btn("2", "icon-link", __("Linked With"),
				function() { me.frm.toolbar.show_linked_with(); });

		// link to user restrictions
		if(!me.frm.meta.issingle && frappe.model.can_restrict(me.frm.doctype, me.frm)) {
			this.$user_properties = this.appframe.add_icon_btn("2", "icon-shield",
				__("User Permission Restrictions"), function() {
					frappe.route_options = {
						property: me.frm.doctype,
						restriction: me.frm.docname
					};
					frappe.set_route("user-properties");
				});
		}

		if(frappe.model.can_print(me.frm.doctype, me.frm)) {
			this.$print = this.appframe.add_icon_btn("2", "icon-print", __("Print"),
				function() { me.frm.print_doc(); });
		}

		if(frappe.model.can_email(me.frm.doctype, me.frm)) {
			this.$print = this.appframe.add_icon_btn("2", "icon-envelope", __("Email"),
				function() { me.frm.email_doc(); });
		}

		if(!this.frm.meta.issingle) {
			this.$prev = this.appframe.add_icon_btn("2", "icon-arrow-left", __("Previous Record"),
				function() { me.go_prev_next(true); });

			this.$next = this.appframe.add_icon_btn("2", "icon-arrow-right", __("Next Record"),
				function() { me.go_prev_next(false); });
		}

	},

	refresh: function() {
		if(!this.frm.doc.__islocal) {
			this.docinfo = frappe.model.docinfo[this.frm.doctype][this.frm.docname];
			// highlight comments
			this.highlight_items();
		}
	},

	highlight_items: function() {
		var me = this;

		this.$timestamp
			.popover("destroy")
			.popover({
				title: "Created and Modified By",
				content: "Created By: " + frappe.user.full_name(me.frm.doc.owner) + "<br>" +
					"Created On: " + dateutil.str_to_user(me.frm.doc.creation) + "<br>" +
					"Last Modified By: " + frappe.user.full_name(me.frm.doc.modified_by) + "<br>" +
					"Last Modifed On: " + dateutil.str_to_user(me.frm.doc.modified),
				trigger:"hover",
				html: true,
				placement: "bottom"
			})

		this.$comments
			.popover("destroy")

		if(this.docinfo.comments && this.docinfo.comments.length) {
			var last = this.docinfo.comments[0];
			this.$comments
				.popover({
					title: "Last Comment",
					content: last.comment
						+ '<p class="text-muted small">By '
						+ frappe.user_info(last.comment_by).fullname
						+ " / " + comment_when(last.creation)
						+ '</p>',
					trigger:"hover",
					html: true,
					placement: "bottom"
				});
		}

		$.each(["comments", "attachments", "assignments"], function(i, v) {
			if(me.docinfo[v] && me.docinfo[v].length)
				me["$" + v].addClass("appframe-iconbar-active");
			else
				me["$" + v].removeClass("appframe-iconbar-active");
		})
	},

	scroll_to: function(cls) {
		$('html, body').animate({
			scrollTop: $(this.frm.wrapper).find(cls).offset().top
		}, 1000);
	},

	go_prev_next: function(prev) {
		var me = this;
		return frappe.call({
			method: "frappe.widgets.form.utils.get_next",
			args: {
				doctype: me.frm.doctype,
				name: me.frm.docname,
				prev: prev ? 1 : 0
			},
			callback: function(r) {
				if(r.message)
					frappe.set_route("Form", me.frm.doctype, r.message);
			}
		});
	},
})
