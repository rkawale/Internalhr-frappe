// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// route urls to their virtual pages

// re-route map (for rename)
frappe.re_route = {};
frappe.route_titles = {};
frappe.route_history = [];
frappe.view_factory = {};
frappe.view_factories = [];

frappe.route = function() {
	if(frappe.re_route[window.location.hash]) {
		// after saving a doc, for example,
		// "New DocType 1" and the renamed "TestDocType", both exist in history
		// now if we try to go back,
		// it doesn't allow us to go back to the one prior to "New DocType 1"
		// Hence if this check is true, instead of changing location hash, 
		// we just do a back to go to the doc previous to the "New DocType 1"
		var re_route_val = frappe.get_route_str(frappe.re_route[window.location.hash]);
		var cur_route_val = frappe.get_route_str(frappe._cur_route);
		if (decodeURIComponent(re_route_val) === decodeURIComponent(cur_route_val)) {
			window.history.back();
			return;
		} else {
			window.location.hash = frappe.re_route[window.location.hash];
		}
	}

	frappe._cur_route = window.location.hash;

	route = frappe.get_route();
	frappe.route_history.push(route);
	
	if(route[0] && frappe.views[route[0] + "Factory"]) {
		// has a view generator, generate!
		if(!frappe.view_factory[route[0]])
			frappe.view_factory[route[0]] = new frappe.views[route[0] + "Factory"]();
			
		frappe.view_factory[route[0]].show();
	} else {
		// show page
		frappe.views.pageview.show(route[0]);
	}

	if(frappe.route_titles[window.location.hash]) {
		document.title = frappe.route_titles[window.location.hash];
	}
}

frappe.get_route = function(route) {	
	// for app
	return frappe.get_route_str(route).split('/')
}

frappe.get_route_str = function(route) {
	if(!route)
		route = window.location.hash;

	if(route.substr(0,1)=='#') route = route.substr(1);
	if(route.substr(0,1)=='!') route = route.substr(1);
	
	route = $.map(route.split('/'), 
		function(r) { return decodeURIComponent(r); }).join('/');

	return route;
}

frappe.set_route = function() {
	route = $.map(arguments, function(a) { 
		if($.isPlainObject(a)) {
			frappe.route_options = a;
			return null;
		} else {
			return a ? encodeURIComponent(a) : null; 
		}
	}).join('/');
	
	window.location.hash = route;
	
	// Set favicon (app.js)
	frappe.app.set_favicon();
}

frappe.set_re_route = function() {
	var tmp = window.location.hash;
	frappe.set_route.apply(null, arguments);
	frappe.re_route[tmp] = window.location.hash;
};


frappe._cur_route = null;

$(window).on('hashchange', function() {
	// save the title
	frappe.route_titles[frappe._cur_route] = document.title;

	if(window.location.hash==frappe._cur_route)
		return;
		
	// hide open dialog
	if(cur_dialog && cur_dialog.hide_on_page_refresh) 
		cur_dialog.hide();
		
	frappe.route();
});