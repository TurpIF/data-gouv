#!/usr/bin/env python
# -*- coding: utf-8 -*-

import xlrd
import csv
import os
import logging

def csv_from_excel(filename):
    wb = xlrd.open_workbook(filename)
    sh = wb.sheet_by_index(0)

    def f(v):
        try:
            return v.encode('utf-8')
        except AttributeError:
            return v

    with open(filename + '.csv', 'wb') as csv_file:
        wr = csv.writer(csv_file, quoting=csv.QUOTE_ALL)
        for rownum in range(sh.nrows):
            line = [f(l) for l in sh.row_values(rownum)]
            wr.writerow(line)

if __name__ == '__main__':
    logging.root.setLevel(logging.INFO)

    for root, dirs, files in os.walk(u"./downloads"):
        for f in files:
            if f.split('.')[-1].lower() in ['xls', 'xlsx']:
                filename = root + '/' + f
                logging.info('Converting %s into CSV' % filename)
                try:
                    csv_from_excel(filename)
                except Exception as e:
                    logging.exception(e)
