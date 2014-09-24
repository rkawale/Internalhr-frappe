// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// misc user functions

frappe.user_info = function(uid) {
	var def = {
		'fullname':uid,
		'image': 'assets/frappe/images/ui/avatar.png'
	}
	if(!frappe.boot.user_info) return def
	if(!frappe.boot.user_info[uid]) return def
	if(!frappe.boot.user_info[uid].fullname)
		frappe.boot.user_info[uid].fullname = uid;
	if(!frappe.boot.user_info[uid].image)
		frappe.boot.user_info[uid].image = def.image;
	return frappe.boot.user_info[uid];
}

frappe.avatar = function(user, large, title) {
	var image = frappe.utils.get_file_link(frappe.user_info(user).image);
	var to_size = large ? 72 : 30;
	if(!title) title = frappe.user_info(user).fullname;

	return repl('<span class="avatar %(small_or_large)s" title="%(title)s">\
		<img src="%(image)s"></span>', {
			image: image,
			title: title,
			small_or_large: large ? "avatar-large" : "avatar-small"
		});
}

frappe.ui.set_user_background = function(src, selector) {
	if(!selector) selector = "#page-desktop";
	if(!src) src = "assets/frappe/images/ui/random-polygons.jpg";
	frappe.dom.set_style(repl('%(selector)s { \
		background: url("%(src)s") center center; \
	}', {src:src, selector:selector}))
}

frappe.provide('frappe.user');

$.extend(frappe.user, {
	name: (frappe.boot ? frappe.boot.user.name : 'Guest'),
	full_name: function(uid) {
		return uid===user ?
			"You" :
			frappe.user_info(uid).fullname;
	},
	image: function(uid) {
		return frappe.user_info(uid).image;
	},
	avatar: function(uid, large) {
		return frappe.avatar(uid, large);
	},
	has_role: function(rl) {
		if(typeof rl=='string')
			rl = [rl];
		for(var i in rl) {
			if((frappe.boot ? frappe.boot.user.roles : ['Guest']).indexOf(rl[i])!=-1)
				return true;
		}
	},
	get_desktop_items: function() {
		// get user sequence preference
		var user_list = frappe.defaults.get_default("_desktop_items");
		if(user_list && user_list.length)
			var modules_list = user_list;

		if(modules_list) {
			// add missing modules - they will be hidden anyways by the view
			$.each(frappe.modules, function(m, module) {
				if(module.link && modules_list.indexOf(m)==-1) {
					modules_list.push(m);
				}
			});
		}

		if(!modules_list || !modules_list.length) {
			// all modules
			modules_list = keys(frappe.modules).sort();
		}

		// filter hidden modules
		if(frappe.boot.hidden_modules && modules_list) {
			var hidden_list = JSON.parse(frappe.boot.hidden_modules);
			var modules_list = $.map(modules_list, function(m) {
				if(hidden_list.indexOf(m)==-1) return m; else return null;
			});
		}

		// hide based on permission
		modules_list = $.map(modules_list, function(m) {
			var type = frappe.modules[m] && frappe.modules[m].type;
			var ret = null;
			switch(type) {
				case "module":
					if(frappe.boot.user.allow_modules.indexOf(m)!=-1)
						ret = m;
					break;
				case "page":
					if(frappe.boot.allowed_pages.indexOf(frappe.modules[m].link)!=-1)
						ret = m;
					break;
				case "list":
					if(frappe.model.can_read(frappe.modules[m].doctype))
						ret = m;
					break;
				case "view":
					ret = m;
					break;
				case "setup":
					ret = m;
					break;
				default:
					ret = m;
			}
			return ret;
		})

		return modules_list;
	},
	get_user_desktop_items: function() {
		var user_list = frappe.defaults.get_default("_user_desktop_items");
		if(!user_list) {
			user_list = frappe.user.get_desktop_items();
		}
		return user_list;
	},
	is_report_manager: function() {
		return frappe.user.has_role(['Administrator', 'System Manager', 'Report Manager']);
	},
});

frappe.session_alive = true;
$(document).bind('mousemove', function() {
	if(frappe.session_alive===false) {
		$(document).trigger("session_alive");
	}
	frappe.session_alive = true;
	if(frappe.session_alive_timeout)
		clearTimeout(frappe.session_alive_timeout);
	frappe.session_alive_timeout = setTimeout('frappe.session_alive=false;', 30000);
})
