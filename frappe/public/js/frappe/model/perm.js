// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt 

frappe.provide("frappe.perm");

// backward compatibilty
var READ = "read", WRITE = "write", CREATE = "create", DELETE = "delete"; 
var SUBMIT = "submit", CANCEL = "cancel", AMEND = "amend";

$.extend(frappe.perm, {
	rights: ["read", "write", "create", "submit", "cancel", "amend",
		"report", "import", "export", "print", "email", "restrict", "delete", "restricted"],
		
	doctype_perm: {},
	
	has_perm: function(doctype, permlevel, ptype, docname) {
		if(!permlevel) permlevel = 0;
		
		if(docname) {
			var perms = frappe.perm.get_perm(doctype, docname);
		} else {
			if(!frappe.perm.doctype_perm[doctype]) {
				frappe.perm.doctype_perm[doctype] = frappe.perm.get_perm(doctype);
			}
			var perms = frappe.perm.doctype_perm[doctype];
		}
		
		if(!perms)
			return false;
			
		if(!perms[permlevel])
			return false;
			
		return !!perms[permlevel][ptype];
	},
	
	get_perm: function(doctype, docname) {
		var perm = [{read: 0}];
		
		var meta = frappe.get_doc("DocType", doctype);
		
		if(!meta) {
			return perm;
		}
		
		if(user==="Administrator" || user_roles.indexOf("Administrator")!==-1) {
			perm[0].read = 1;
		}
		
		if(docname && !frappe.perm.has_unrestricted_access(doctype, docname, perm[0].restricted)) {
			// if has restricted data, return not permitted
			return perm;
		}
		
		var docperms = frappe.get_doc("DocType", doctype).permissions || [];
		$.each(docperms, function(i, p) {
			// if user has this role
			if(user_roles.indexOf(p.role)!==-1) {
				var permlevel = cint(p.permlevel);
				if(!perm[permlevel]) {
					perm[permlevel] = {};
				}
				$.each(frappe.perm.rights, function(i, key) {
					if(key=="restricted") {
						perm[permlevel][key] = (perm[permlevel][key] || 1) && (p[key] || 0);
					} else {
						perm[permlevel][key] = perm[permlevel][key] || (p[key] || 0);
					}
				});
			}
		});
		
		return perm;
	},
	
	has_unrestricted_access: function(doctype, docname, restricted) {
		var restrictions = frappe.defaults.get_restrictions();
		var doc = frappe.get_doc(doctype, docname);

		if(restricted) {
			if(doc.owner==user) return true;
			if(!restrictions || $.isEmptyObject(restrictions)) {
				return false;
			}
		} else {
			if(!restrictions || $.isEmptyObject(restrictions)) {
				return true;
			}
		}
		
		// prepare restricted fields
		var fields_to_check = frappe.perm.get_restricted_fields(doctype, docname, restrictions);
		
		// loop and find if has restricted data
		var has_restricted_data = false;
		var doc = frappe.get_doc(doctype, docname);
		$.each(fields_to_check, function(i, df) {
			if(doc[df.fieldname] && restrictions[df.options].indexOf(doc[df.fieldname])===-1) {
				has_restricted_data = true;
				return false;
			}
		});
		
		return !has_restricted_data;
	},
	
	get_restricted_fields: function(doctype, docname, restrictions) {
		var fields_to_check = frappe.meta.get_restricted_fields(doctype, docname,
			Object.keys(restrictions));
		if(Object.keys(restrictions).indexOf(doctype)!==-1) {
			fields_to_check = fields_to_check.concat(
				{label: "Name", fieldname: name, options: doctype});
		}
		return fields_to_check;
	},
		
	get_match_rules: function(doctype) {
		var match_rules = {};
						
		// Rule for restrictions
		var restrictions = frappe.defaults.get_restrictions();
		if(restrictions && !$.isEmptyObject(restrictions)) {
			$.each(frappe.perm.get_restricted_fields(doctype, null, restrictions), function(i, df) {
				match_rules[df.label] = restrictions[df.options];
			});
		}
		
		return match_rules;
	},
	
	get_field_display_status: function(df, doc, perm, explain) {
		if(!doc) return "Write";
		
		perm = perm || frappe.perm.get_perm(doc.doctype, doc.name);
		if(!df.permlevel) df.permlevel = 0;
		var p = perm[df.permlevel];
		var status = "None";
		
		// permission
		if(p) {
			if(p.write && !df.disabled) {
				status = "Write";
			} else if(p.read) {
				status = "Read";
			}
		}		
		if(explain) console.log("By Permission:" + status);
		
		// hidden
		if(cint(df.hidden)) status = "None";
		if(explain) console.log("By Hidden:" + status);
		
		// hidden due to dependency
		if(cint(df.hidden_due_to_dependency)) status = "None";
		if(explain) console.log("By Hidden Due To Dependency:" + status);
		
		// submit
		if(status==="Write" && cint(doc.docstatus) > 0) status = "Read";
		if(explain) console.log("By Submit:" + status);
		
		// allow on submit
		var allow_on_submit = df.fieldtype==="Table" ? 0 : cint(df.allow_on_submit);
		if(status==="Read" && allow_on_submit && cint(doc.docstatus)===1 && p.write) {
			status = "Write";
		}
		if(explain) console.log("By Allow on Submit:" + status);
		
		// workflow state
		if(status==="Read" && cur_frm && cur_frm.state_fieldname) {
			// fields updated by workflow must be read-only
			if(cint(cur_frm.read_only) || 
				in_list(cur_frm.states.update_fields, df.fieldname) ||
				df.fieldname==cur_frm.state_fieldname) {
				status = "Read";
			}
		}
		if(explain) console.log("By Workflow:" + status);
		
		// read only field is checked
		if(status==="Write" && cint(df.read_only)) {
			status = "Read";
		}
		if(explain) console.log("By Read Only:" + status);
		
		if(status==="Write" && df.set_only_once && !doc.__islocal) {
			status = "Read";
		}
		if(explain) console.log("By Set Only Once:" + status);
		
		return status;
	},
});