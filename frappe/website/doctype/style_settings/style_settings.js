// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt


cur_frm.cscript.onload_post_render = function() {
	frappe.require('assets/frappe/js/lib/jscolor/jscolor.js');
	$.each(["background_color", "page_background", "page_text", "page_links", 
		"top_bar_background", "top_bar_foreground", "page_headings"], function(i, v) {
		$(cur_frm.fields_dict[v].input).addClass('color');
	})
	jscolor.bind();
}