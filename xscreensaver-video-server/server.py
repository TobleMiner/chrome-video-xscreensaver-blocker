#!/bin/env python3

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from threading import Timer
from subprocess import call

SCREENSAVER_PORT = 23433

class ScreensaverBlockHandler():
	def __init__(self):
		self.blocked = False

	def block(self):
		print('Screensaver blocked')
		self.blocked = True

	def unblock(self):
		print('Screensaver unblocked')
		self.blocked = False

class XScreensaverBlockHandler(ScreensaverBlockHandler):
	UNBLOCK_INTERVAL = 30

	def __init__(self, xscr_cmd_bin='/usr/bin/xscreensaver-command'):
		super().__init__()
		self.xscr_cmd_bin = xscr_cmd_bin
		self.xscr_cmd_timer = None
		self.do_block()

	def do_block(self):
		self.xscr_cmd_timer = Timer(XScreensaverBlockHandler.UNBLOCK_INTERVAL, self.do_block)
		if(self.blocked):
			exit_code = call(self.xscr_cmd_bin + ' -time | grep -q non-blanked', shell=True)
			if(exit_code == 0):
				call(self.xscr_cmd_bin + ' -deactivate', shell=True)
		self.xscr_cmd_timer.start()

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
