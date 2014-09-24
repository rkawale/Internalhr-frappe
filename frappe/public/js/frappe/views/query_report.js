// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.provide("frappe.views");
frappe.provide("frappe.query_reports");

frappe.standard_pages["query-report"] = function() {
	var wrapper = frappe.container.add_page('query-report');

	frappe.require("assets/js/slickgrid.min.js");

	frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Query Report'),
		single_column: true
	});

	frappe.query_report = new frappe.views.QueryReport({
		parent: wrapper,
	});

	$(wrapper).bind("show", function() {
		frappe.query_report.load();
	});
}

frappe.views.QueryReport = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		// globalify for slickgrid
		this.appframe = this.parent.appframe;
		this.parent.query_report = this;
		this.make();
	},
	slickgrid_options: {
		enableColumnReorder: false,
	    showHeaderRow: true,
	    headerRowHeight: 30,
	    explicitInitialization: true,
	    multiColumnSort: true
	},
	make: function() {
		this.wrapper = $("<div>").appendTo($(this.parent).find(".layout-main"));
		$('<div class="waiting-area" style="display: none;"></div>\
		<div class="no-report-area well" style="display: none;">\
		</div>\
		<div class="results" style="display: none;">\
			<div class="result-area" style="height:400px; \
				border: 1px solid #aaa;"></div>\
			<p class="text-muted"><br>\
				'+__('For comparative filters, start with')+' ">" or "<", e.g. >5 or >01-02-2012\
				<br>'+__('For ranges')+' ('+__('values and dates')+') use ":", \
					e.g. "5:10" (to filter values between 5 & 10)</p>\
		</div>').appendTo(this.wrapper);

		this.make_toolbar();
	},
	make_toolbar: function() {
		var me = this;
		this.appframe.set_title_right(__('Refresh'), function() { me.refresh(); });

		// Edit
		var edit_btn = this.appframe.add_primary_action(__('Edit'), function() {
			if(!frappe.user.is_report_manager()) {
				msgprint(__("You are not allowed to create / edit reports"));
				return false;
			}
			frappe.set_route("Form", "Report", me.report_name);
		}, "icon-edit");

		this.appframe.add_primary_action(__('Export'), function() { me.export_report(); },
			"icon-download");

		if(frappe.model.can_restrict("Report")) {
			this.appframe.add_primary_action(__("User Restrictions"), function() {
				frappe.route_options = {
					property: "Report",
					restriction: me.report_name
				};
				frappe.set_route("user-properties");
			}, "icon-shield");
		}
	},
	load: function() {
		// load from route
		var route = frappe.get_route();
		var me = this;
		if(route[1]) {
			if((me.report_name!=route[1]) || frappe.route_options) {
				me.report_name = route[1];
				this.wrapper.find(".no-report-area").toggle(false);
				me.appframe.set_title(__("Query Report")+": " + __(me.report_name));

				me.appframe.set_title_left(function() {
					frappe.set_route(frappe.get_module(me.report_doc.module).link); });


				frappe.model.with_doc("Report", me.report_name, function() {
					me.report_doc = frappe.get_doc("Report", me.report_name);

					frappe.model.with_doctype(me.report_doc.ref_doctype, function() {
						if(!frappe.query_reports[me.report_name]) {
							return frappe.call({
								method:"frappe.widgets.query_report.get_script",
								args: {
									report_name: me.report_name
								},
								callback: function(r) {
									me.appframe.set_title(__("Query Report")+": " + __(me.report_name));
									frappe.dom.eval(r.message || "");
									me.setup_filters();
									me.refresh();
								}
							});
						} else {
							me.setup_filters();
							me.refresh();
						}
					});
				});
			}
		} else {
			var msg = __("No Report Loaded. Please use query-report/[Report Name] to run a report.")
			this.wrapper.find(".no-report-area").html(msg).toggle(true);
		}
	},
	setup_filters: function() {
		this.clear_filters();
		var me = this;
		$.each(frappe.query_reports[this.report_name].filters || [], function(i, df) {
			if(df.fieldtype==="Break") {
				me.appframe.add_break();
			} else {
				var f = me.appframe.add_field(df);
				$(f.wrapper).addClass("filters pull-left");
				me.filters.push(f);
				if(df["default"]) {
					f.set_input(df["default"]);
				}
				if(df.fieldtype=="Check") {
					$(f.wrapper).find("input[type='checkbox']").css({"float":"None"});
				}

				if(df.get_query) f.get_query = df.get_query;
			}
		});
		this.set_route_filters()
		this.set_filters_by_name();
	},
	clear_filters: function() {
		this.filters = [];
		this.appframe.parent.find('.appframe-form .filters').remove();
	},
	set_route_filters: function() {
		var me = this;
		if(frappe.route_options) {
			$.each(this.filters || [], function(i, f) {
				if(frappe.route_options[f.df.fieldname]!=null) {
					f.set_input(frappe.route_options[f.df.fieldname]);
				}
			});
		}
		frappe.route_options = null;
	},
	set_filters_by_name: function() {
		this.filters_by_name = {};

		for(var i in this.filters) {
			this.filters_by_name[this.filters[i].df.fieldname] = this.filters[i];
		}
	},
	refresh: function() {
		// Run
		var me =this;
		this.waiting = frappe.messages.waiting(this.wrapper.find(".waiting-area").empty().toggle(true),
			"Loading Report...");
		this.wrapper.find(".results").toggle(false);
		var filters = {};
		$.each(this.filters || [], function(i, f) {
			filters[f.df.fieldname] = f.get_parsed_value();
		})
		return frappe.call({
			method: "frappe.widgets.query_report.run",
			type: "GET",
			args: {
				"report_name": me.report_name,
				filters: filters
			},
			callback: function(r) {
				me.report_ajax = undefined;
				me.make_results(r.message.result, r.message.columns);
			}
		});

		return this.report_ajax;
	},
	get_values: function() {
		var filters = {};
		var mandatory_fields = [];
		$.each(this.filters || [], function(i, f) {
			var v = f.get_parsed_value();
			if(v === '%') v = null;
			if(f.df.reqd && !v) mandatory_fields.push(f.df.label);
			if(v) filters[f.df.fieldname] = v;
		})
		if(mandatory_fields.length) {
			frappe.throw(__("Mandatory filters required:\n") + __(mandatory_fields.join("\n")));
		}
		return filters
	},
	make_results: function(result, columns) {
		this.wrapper.find(".waiting-area").empty().toggle(false);
		this.wrapper.find(".results").toggle(true);
		this.make_columns(columns);
		this.make_data(result, columns);
		this.render(result, columns);
	},
	render: function(result, columns) {
		this.columnFilters = {};
		this.make_dataview();
		this.id = frappe.dom.set_unique_id(this.wrapper.find(".result-area").get(0));

		this.grid = new Slick.Grid("#"+this.id, this.dataView, this.columns,
			this.slickgrid_options);

		this.grid.setSelectionModel(new Slick.CellSelectionModel());
		this.grid.registerPlugin(new Slick.CellExternalCopyManager({
			dataItemColumnValueExtractor: function(item, columnDef, value) {
				return item[columnDef.field];
			}
		}));

		this.setup_header_row();
		this.grid.init();
		this.setup_sort();
	},
	make_columns: function(columns) {
		this.columns = [{id: "_id", field: "_id", name: "Sr No", width: 60}]
			.concat($.map(columns, function(c) {
				var col = {name:c, id: c, field: c, sortable: true, width: 80}

				if(c.indexOf(":")!=-1) {
					var opts = c.split(":");
					var df = {
						label: opts.length<=2 ? opts[0] : opts.slice(0, opts.length - 2).join(":"),
						fieldtype: opts.length<=2 ? opts[1] : opts[opts.length - 2],
						width: opts.length<=2 ? opts[2] : opts[opts.length - 1]
					}

					if(!df.fieldtype)
						df.fieldtype="Data";

					if(df.fieldtype.indexOf("/")!=-1) {
						var tmp = df.fieldtype.split("/");
						df.fieldtype = tmp[0];
						df.options = tmp[1];
					}

					col.df = df;
					col.formatter = function(row, cell, value, columnDef, dataContext) {
						return frappe.format(value, columnDef.df, null, dataContext);
					}

					// column parameters
					col.name = col.id = col.field = df.label;
					col.name = __(df.label);
					col.fieldtype = opts[1];

					// width
					if(df.width) {
						col.width=parseInt(df.width);
					}
				} else {
					col.df = {
						label: c,
						fieldtype: "Data"
					}
				}
				col.name = __(toTitle(col.name.replace(/_/g, " ")))
				return col
		}));
	},
	make_data: function(result, columns) {
		var me = this;
		this.data = [];
		for(var row_idx=0, l=result.length; row_idx < l; row_idx++) {
			var row = result[row_idx];
			var newrow = {};
			for(var i=1, j=this.columns.length; i<j; i++) {
				newrow[this.columns[i].field] = row[i-1];
			};
			newrow._id = row_idx + 1;
			newrow.id = newrow.name ? newrow.name : ("_" + newrow._id);
			this.data.push(newrow);
		}
	},
	make_dataview: function() {
		// initialize the model
		this.dataView = new Slick.Data.DataView({ inlineFilters: true });
		this.dataView.beginUpdate();
		this.dataView.setItems(this.data);
		this.dataView.setFilter(this.inline_filter);
		this.dataView.endUpdate();

		var me = this;
		this.dataView.onRowCountChanged.subscribe(function (e, args) {
			me.grid.updateRowCount();
			me.grid.render();
		});

		this.dataView.onRowsChanged.subscribe(function (e, args) {
			me.grid.invalidateRows(args.rows);
			me.grid.render();
		});
	},
	inline_filter: function (item) {
		var me = frappe.container.page.query_report;
		for (var columnId in me.columnFilters) {
			if (columnId !== undefined && me.columnFilters[columnId] !== "") {
				var c = me.grid.getColumns()[me.grid.getColumnIndex(columnId)];
				if (!me.compare_values(item[c.field], me.columnFilters[columnId],
						me.columns[me.grid.getColumnIndex(columnId)])) {
					return false;
				}
			}
		}
		return true;
	},
	compare_values: function(value, filter, columnDef) {
		var invert = false;

		// check if invert
		if(filter[0]=="!") {
			invert = true;
			filter = filter.substr(1);
		}

		var out = false;
		var cond = "=="

		// parse condition
		if(filter[0]==">") {
			filter = filter.substr(1);
			cond = ">"
		} else if(filter[0]=="<") {
			filter = filter.substr(1);
			cond = "<"
		}

		if(in_list(['Float', 'Currency', 'Int', 'Date'], columnDef.df.fieldtype)) {
			// non strings
			if(filter.indexOf(":")==-1) {
				if(columnDef.df.fieldtype=="Date") {
					filter = dateutil.user_to_str(filter);
				}

				if(in_list(["Float", "Currency", "Int"], columnDef.df.fieldtype)) {
					value = flt(value);
					filter = flt(filter);
				}

				out = eval("value" + cond + "filter");
			} else {
				// range
				filter = filter.split(":");
				if(columnDef.df.fieldtype=="Date") {
					filter[0] = dateutil.user_to_str(filter[0]);
					filter[1] = dateutil.user_to_str(filter[1]);
				}

				if(in_list(["Float", "Currency", "Int"], columnDef.df.fieldtype)) {
					value = flt(value);
					filter[0] = flt(filter[0]);
					filter[1] = flt(filter[1]);
				}

				out = value >= filter[0] && value <= filter[1];
			}
		} else {
			// string
			value = value + "";
			value = value.toLowerCase();
			filter = filter.toLowerCase();
			out = value.indexOf(filter) != -1;
		}

		if(invert)
			return !out;
		else
			return out;
	},
	setup_header_row: function() {
		var me = this;

		$(this.grid.getHeaderRow()).delegate(":input", "change keyup", function (e) {
			var columnId = $(this).data("columnId");
			if (columnId != null) {
				me.columnFilters[columnId] = $.trim($(this).val());
				me.dataView.refresh();
			}
		});

		this.grid.onHeaderRowCellRendered.subscribe(function(e, args) {
			$(args.node).empty();
			$("<input type='text'>")
				.data("columnId", args.column.id)
				.val(me.columnFilters[args.column.id])
				.appendTo(args.node);
		});
	},
	setup_sort: function() {
		var me = this;
		this.grid.onSort.subscribe(function (e, args) {
			var cols = args.sortCols;

			me.data.sort(function (dataRow1, dataRow2) {
				for (var i = 0, l = cols.length; i < l; i++) {
					var field = cols[i].sortCol.field;
					var sign = cols[i].sortAsc ? 1 : -1;
					var value1 = dataRow1[field], value2 = dataRow2[field];
					var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
					if (result != 0) {
						return result;
					}
				}
				return 0;
			});
			me.dataView.beginUpdate();
			me.dataView.setItems(me.data);
			me.dataView.endUpdate();
			me.dataView.refresh();
	    });
	},
	export_report: function() {
		if(!frappe.model.can_export(this.report_doc.ref_doctype)) {
			msgprint(_("You are not allowed to export this report"));
			return false;
		}

		var result = $.map(frappe.slickgrid_tools.get_view_data(this.columns, this.dataView),
		 	function(row) {
				return [row.splice(1)];
		});
		this.title = this.report_name;
		frappe.tools.downloadify(result, null, this);
		return false;
	}
})
