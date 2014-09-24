# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe
from frappe.utils.scheduler import enqueue_events
from frappe.celery_app import get_celery, celery_task, task_logger, LONGJOBS_PREFIX
from frappe.cli import get_sites
from frappe.utils.file_lock import delete_lock

@celery_task()
def sync_queues():
	"""notifies workers to monitor newly added sites"""
	app = get_celery()
	shortjob_workers, longjob_workers = get_workers(app)

	if shortjob_workers:
		for worker in shortjob_workers:
			sync_worker(app, worker)
	
	if longjob_workers:
		for worker in longjob_workers:
			sync_worker(app, worker, prefix=LONGJOBS_PREFIX)
			
def get_workers(app):
	longjob_workers = []
	shortjob_workers = []

	active_queues = app.control.inspect().active_queues()
	for worker in active_queues:
		if worker.startswith(LONGJOBS_PREFIX):
			longjob_workers.append(worker)
		else:
			shortjob_workers.append(worker)
	
	return shortjob_workers, longjob_workers

def sync_worker(app, worker, prefix=''):
	active_queues = set(get_active_queues(app, worker))
	required_queues = set(get_required_queues(app, prefix=prefix))
	to_add = required_queues - active_queues
	to_remove = active_queues - required_queues
	for queue in to_add:
		app.control.broadcast('add_consumer', arguments={
				'queue': queue
		}, reply=True, destination=[worker])
	for queue in to_remove:
		app.control.broadcast('cancel_consumer', arguments={
				'queue': queue
		}, reply=True, destination=[worker])


def get_active_queues(app, worker):
	active_queues = app.control.inspect().active_queues()
	return [queue['name'] for queue in active_queues[worker]]

def get_required_queues(app, prefix=''):
	ret = []
	for site in get_sites():
		ret.append('{}{}'.format(prefix, site))
	ret.append(app.conf['CELERY_DEFAULT_QUEUE'])
	return ret

@celery_task()
def scheduler_task(site, event, handler, now=False):
	from frappe.utils.scheduler import log
	traceback = ""
	task_logger.info('running {handler} for {site} for event: {event}'.format(handler=handler, site=site, event=event))
	try:
		if not now:
			frappe.connect(site=site)
		frappe.get_attr(handler)()
	
	except Exception:
		frappe.db.rollback()
		traceback = log(handler, "Method: {event}, Handler: {handler}".format(event=event, handler=handler))
		task_logger.warn(traceback)
		raise
		
	else:
		frappe.db.commit()

	finally:
		delete_lock(handler)
		
		if not now:
			frappe.destroy()

	task_logger.info('ran {handler} for {site} for event: {event}'.format(handler=handler, site=site, event=event))

@celery_task()
def enqueue_scheduler_events():
	for site in get_sites():
		frappe.connect(site=site)
		enqueue_events(site)
		frappe.destroy()
