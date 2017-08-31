#!/bin/env python3

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from threading import Timer
from os import execl, fork
from subprocess import call

SCREENSAVER_PORT = 23433

class ScreensaverBlockHandler():
	def block(self):
		raise NotImplementedError()

	def unblock(self):
		raise NotImplementedError()

class XScreensaverBlockHandler(ScreensaverBlockHandler):
	UNBLOCK_INTERVAL = 30

	def __init__(self, xscr_cmd_bin='/usr/bin/xscreensaver-command'):
		self.xscr_cmd_bin = xscr_cmd_bin
		self.xscr_cmd_timer = None

	def block(self):
		print('Xscreensaver blocked')
		self.do_block()

	def do_block(self):
		self.xscr_cmd_timer = Timer(XScreensaverBlockHandler.UNBLOCK_INTERVAL, self.do_block)
		exit_code = call(self.xscr_cmd_bin + ' -time | grep -q non-blanked', shell=True)
		if(exit_code == 0):
			call(self.xscr_cmd_bin + ' -deactivate', shell=True)
		self.xscr_cmd_timer.start()

	def unblock(self):
		print('Xscreensaver unblocked')
		if(self.xscr_cmd_timer):
			self.xscr_cmd_timer.cancel();
			self.xscr_cmd_timer = None

class ScreensaverRequestHandler(BaseHTTPRequestHandler):
	def do_GET(self):
		query = urlparse(self.path).query
		query_components = dict(qc.split('=') for qc in query.split('&'))
		if not 'block' in query_components:
			return
		if query_components['block'].lower() == 'true':
			scrv_handler.block()
		else:
			scrv_handler.unblock()

scrv_handler = XScreensaverBlockHandler()
server = HTTPServer(('127.0.0.1', SCREENSAVER_PORT), ScreensaverRequestHandler)
server.serve_forever()
