// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

//168
// Refresh
// --------

cur_frm.cscript.refresh = function(doc, cdt, cdn) {
	cur_frm.toggle_enable('dt', doc.__islocal);
	cur_frm.cscript.dt(doc, cdt, cdn);
	cur_frm.toggle_reqd('label', !doc.fieldname);
}


cur_frm.cscript.has_special_chars = function(t) {
	var iChars = "!@#$%^&*()+=-[]\\\';,./{}|\":<>?";
	for (var i = 0; i < t.length; i++) {
		if (iChars.indexOf(t.charAt(i)) != -1) {
			return true;
		}
	}
	return false;
}


// Label
// ------
cur_frm.cscript.label = function(doc){
	if(doc.label && cur_frm.cscript.has_special_chars(doc.label)){
		cur_frm.fields_dict['label_help'].disp_area.innerHTML = '<font color = "red">Special Characters are not allowed</font>';
		doc.label = '';
		refresh_field('label');
	}
	else
		cur_frm.fields_dict['label_help'].disp_area.innerHTML = '';
}


cur_frm.fields_dict['dt'].get_query = function(doc, dt, dn) {
	filters = [
		['DocType', 'issingle', '=', 0],
	];
	if(user!=="Administrator") {
		filters.push(['DocType', 'module', '!=', 'Core'])
	}
	return filters
}

cur_frm.cscript.fieldtype = function(doc, dt, dn) {
	if(doc.fieldtype == 'Link') cur_frm.fields_dict['options_help'].disp_area.innerHTML = 'Please enter name of the document you want this field to be linked to in <b>Options</b>.<br> Eg.: Customer';
	else if(doc.fieldtype == 'Select') cur_frm.fields_dict['options_help'].disp_area.innerHTML = 'Please enter values in <b>Options</b> separated by enter. <br>Eg.: <b>Field:</b> Country <br><b>Options:</b><br>China<br>India<br>United States<br><br><b> OR </b><br>You can also link it to existing Documents.<br>Eg.: <b>link:</b>Customer';
	else cur_frm.fields_dict['options_help'].disp_area.innerHTML = '';
}


cur_frm.cscript.dt = function(doc, dt, dn) {
	if(!doc.dt) {
		set_field_options('insert_after', '');
		return;
	}
	var insert_after = doc.insert_after || null;
	return frappe.call({
		method: 'frappe.core.doctype.custom_field.custom_field.get_fields_label',
		args: { doctype: doc.dt, fieldname: doc.fieldname },
		callback: function(r, rt) {
			set_field_options('insert_after', r.message);

			if(insert_after==null || !in_list(r.message.split("\n"), insert_after)) {
				insert_after = r.message.split("\n")[0];
			}

			cur_frm.set_value('insert_after', insert_after);
		}
	});
}
