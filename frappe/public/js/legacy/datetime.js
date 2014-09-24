// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// Date

function same_day(d1, d2) {
	if(d1.getFullYear()==d2.getFullYear() && d1.getMonth()==d2.getMonth() && d1.getDate()==d2.getDate())return true; else return false;
}
var month_list = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var month_last = {1:31,2:28,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31}
var month_list_full = ['January','February','March','April','May','June','July','August','September','October','November','December'];

var week_list = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var week_list_full = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function int_to_str(i, len) {
	i = ''+i;
	if(i.length<len)for(c=0;c<(len-i.length);c++)i='0'+i;
	return i
}

frappe.datetime = {

	str_to_obj: function(d) {
		if(typeof d=="object") return d;
		if(!d) return new Date();
		var tm = [0, 0];
		if(d.search(' ')!=-1) {
			var tm = d.split(' ')[1].split(':');
			var d = d.split(' ')[0];
		}
		if(d.search('-')!=-1) {
			var t = d.split('-'); return new Date(t[0],t[1]-1,t[2],tm[0],tm[1]);
		} else if(d.search('/')!=-1) {
			var t = d.split('/'); return new Date(t[0],t[1]-1,t[2],tm[0],tm[1]);
		} else {
			return new Date();
		}
	},

	obj_to_str: function(d) {
		if(typeof d=='string') return d;
		return d.getFullYear() + '-' + int_to_str(d.getMonth()+1,2) + '-' + int_to_str(d.getDate(),2);
	},

	obj_to_user: function(d) {
		return dateutil.str_to_user(dateutil.obj_to_str(d));
	},

	get_ms_diff: function(d1, d2) {
		if(typeof d1=='string') d1 = dateutil.str_to_obj(d1);
		if(typeof d2=='string') d2 = dateutil.str_to_obj(d2);
		return d1-d2
	},

	get_diff: function(d1, d2) {
		return Math.round(dateutil.get_ms_diff(d1, d2) / 86400000);
	},

	get_hour_diff: function(d1, d2) {
		return Math.round(dateutil.get_ms_diff(d1, d2) / 3600000);
	},

	get_day_diff: function(d1, d2) {
		return dateutil.get_diff(new Date(d1.getYear(), d1.getMonth(), d1.getDate(), 0, 0),
			new Date(d2.getYear(), d2.getMonth(), d2.getDate(), 0, 0))
	},

	add_days: function(d, days) {
		var dt = dateutil.str_to_obj(d);
		var new_dt = new Date(dt.getTime()+(days*24*60*60*1000));
		return dateutil.obj_to_str(new_dt);
	},

	add_months: function(d, months) {
		dt = dateutil.str_to_obj(d)
		months = cint(months);
		new_dt = new Date(dt.getFullYear(), dt.getMonth()+months, dt.getDate())
		if(new_dt.getDate() != dt.getDate()) {
			// month has changed, go the last date of prev month
			return dateutil.month_end(new Date(dt.getFullYear(), dt.getMonth()+months, 1))
		}
		return dateutil.obj_to_str(new_dt);
	},

	month_start: function(d, month) {
		if(!d)var d = new Date();
		var m = month ? cint(month) : d.getMonth() + 1;
		return d.getFullYear() + '-' + int_to_str(m, 2) + '-01';
	},

	month_end: function(d, month) {
		if(!d)var d = new Date();
		var m = month ? cint(month) : d.getMonth() + 1;
		var y = d.getFullYear();
		var last_date = new Date(y, m, 0).getDate();
		return y + '-' + int_to_str(m, 2) + '-' + int_to_str(last_date, 2);
	},

	get_user_fmt: function() {
		var t = sys_defaults.date_format;
		if(!t) t = 'yyyy-mm-dd';
		return t;
	},

	str_to_user: function(val, no_time_str) {
		var user_fmt = dateutil.get_user_fmt();
		var time_str = '';

		if(val==null||val=='')return null;

		// separate time string if there
		if(val.search(' ')!=-1) {
			var tmp = val.split(' ');
			if(tmp[1])
				time_str = ' ' + tmp[1];
			var d = tmp[0];
		} else {
			var d = val;
		}

		if(no_time_str)time_str = '';

		// set to user fmt
		d = d.split('-');
		if(d.length==3) {
			if(user_fmt=='dd-mm-yyyy')
				val =  d[2]+'-'+d[1]+'-'+d[0] + time_str;
			else if(user_fmt=='dd/mm/yyyy')
				val =  d[2]+'/'+d[1]+'/'+d[0] + time_str;
			else if(user_fmt=='yyyy-mm-dd')
				val =  d[0]+'-'+d[1]+'-'+d[2] + time_str;
			else if(user_fmt=='mm/dd/yyyy')
				val =  d[1]+'/'+d[2]+'/'+d[0] + time_str;
			else if(user_fmt=='mm-dd-yyyy')
				val =  d[1]+'-'+d[2]+'-'+d[0] + time_str;
		}

		return val;
	},

	full_str: function() {
		var d = new Date();
		return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate() + ' '
		+ d.getHours()  + ':' + d.getMinutes()   + ':' + d.getSeconds();
	},

	user_to_str: function(d, no_time_str) {
		var user_fmt = this.get_user_fmt();

		var time_str = '';
		if (d.search(/ /)!=-1) {
			time_str = " " + d.split(" ")[1];
			d = d.split(" ")[0];
		}

		if(user_fmt=='dd-mm-yyyy') {
			var d = d.split('-');
			var val = d[2]+'-'+d[1]+'-'+d[0];
		}
		else if(user_fmt=='dd/mm/yyyy') {
			var d = d.split('/');
			var val = d[2]+'-'+d[1]+'-'+d[0];
		}
		else if(user_fmt=='yyyy-mm-dd') {
			var val = d;
		}
		else if(user_fmt=='mm/dd/yyyy') {
			var d = d.split('/');
			var val = d[2]+'-'+d[0]+'-'+d[1];
		}
		else if(user_fmt=='mm-dd-yyyy') {
			var d = d.split('-');
			var val = d[2]+'-'+d[0]+'-'+d[1];
		}

		if(time_str && time_str.indexOf(".")===-1) time_str += ".0";
		if(no_time_str)time_str = '';

		return val + time_str;
	},

	user_to_obj: function(d) {
		return dateutil.str_to_obj(dateutil.user_to_str(d));
	},

	global_date_format: function(d) {
		if(d.substr) d = this.str_to_obj(d);
		return nth(d.getDate()) + ' ' + month_list_full[d.getMonth()] + ' ' + d.getFullYear();
	},

	get_today: function() {
		var today = new Date();
		var m = (today.getMonth()+1)+'';
		if(m.length==1)m='0'+m;
		var d = today.getDate()+'';
		if(d.length==1)d='0'+d;
		return today.getFullYear()+'-'+m+'-'+d;
	},

	get_cur_time: function() {
		return frappe.datetime.now_time();
	}
}

frappe.datetime.only_date = function(val) {
	if(val==null||val=='')return null;
	if(val.search(':')!=-1) {
		var tmp = val.split(' ');
		var d = tmp[0].split('-');
	} else {
		var d = val.split('-');
	}
	if(d.length==3)
		val =  d[2]+'-'+d[1]+'-'+d[0];
	return val;
}

// globals (deprecate)
var date = dateutil = frappe.datetime;
var get_today = frappe.datetime.get_today
var only_date = frappe.datetime.only_date;
