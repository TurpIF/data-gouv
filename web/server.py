import sys
from flask import Flask, abort, request
import json
import requests
import os
from collections import Counter
import logging

logger = logging.getLogger("server_cluster")
logger.setLevel(logging.INFO)

# Data loading
with open('./data/regions.geojson') as f:
    regions = json.load(f)

with open('./data/departements.geojson') as f:
    departements = json.load(f)

with open('./data/communes.geojson') as f:
    communes = json.load(f)

def is_bounded(pos, zone):
    return zone[0] <= pos[0] <= zone[2] and zone[1] <= pos[1] <= zone[3]

def bound_geojson(data, bound):
    zones = data['features']
    bounded_zones = []
    for z in zones:
        geo = z['geometry']
        type_ = geo['type']
        if type_ != 'Polygon' and type_ != 'MultiPolygon':
            continue

        if type_ == 'Polygon':
            coord = geo['coordinates'][0]
            for c in coord:
                if is_bounded((c[1], c[0]), bound):
                    bounded_zones.append(z)
                    break
        elif type_ == 'MultiPolygon':
            for coord in geo['coordinates']:
                for c in coord[0]:
                    if is_bounded((c[1], c[0]), bound):
                        bounded_zones.append(z)
                        break
    return {'type': 'FeatureCollection', 'features': bounded_zones}

def get_regions(min_lat, min_lng, max_lat, max_lng):
    bound = [min_lat, min_lng, max_lat, max_lng]
    return bound_geojson(regions, bound)

def get_departements(min_lat, min_lng, max_lat, max_lng):
    bound = [min_lat, min_lng, max_lat, max_lng]
    return bound_geojson(departements, bound)

def get_communes(min_lat, min_lng, max_lat, max_lng):
    bound = [min_lat, min_lng, max_lat, max_lng]
    return bound_geojson(communes, bound)

def get_aggreg_mode(min_lat, min_lng, max_lat, max_lng):
    return 'departements'

# flask app
app = Flask(__name__, static_folder='./', static_url_path='')

# fix for index page
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/zone/regions/<min_lat>/<min_lng>/<max_lat>/<max_lng>')
def api_zone_regions(min_lat, min_lng, max_lat, max_lng):
    try:
        min_lat = float(min_lat)
        min_lng = float(min_lng)
        max_lat = float(max_lat)
        max_lng = float(max_lng)
    except ValueError as e:
        logger.exception(e)
        abort(500)
    return json.dumps(get_regions(min_lat, min_lng, max_lat, max_lng))

@app.route('/api/zone/departements/<min_lat>/<min_lng>/<max_lat>/<max_lng>')
def api_zone_departements(min_lat, min_lng, max_lat, max_lng):
    try:
        min_lat = float(min_lat)
        min_lng = float(min_lng)
        max_lat = float(max_lat)
        max_lng = float(max_lng)
    except ValueError as e:
        logger.exception(e)
        abort(500)
    return json.dumps(get_departements(min_lat, min_lng, max_lat, max_lng))

@app.route('/api/zone/communes/<min_lat>/<min_lng>/<max_lat>/<max_lng>')
def api_zone_communes(min_lat, min_lng, max_lat, max_lng):
    try:
        min_lat = float(min_lat)
        min_lng = float(min_lng)
        max_lat = float(max_lat)
        max_lng = float(max_lng)
    except ValueError as e:
        logger.exception(e)
        abort(500)
    return json.dumps(get_communes(min_lat, min_lng, max_lat, max_lng))

@app.route('/api/zone/<min_lat>/<min_lng>/<max_lat>/<max_lng>')
def api_zone(min_lat, min_lng, max_lat, max_lng):
    try:
        min_lat = float(min_lat)
        min_lng = float(min_lng)
        max_lat = float(max_lat)
        max_lng = float(max_lng)
    except ValueError as e:
        logger.exception(e)
        abort(500)

    mode = get_aggreg_mode(min_lat, min_lng, max_lat, max_lng)
    if mode == 'regions':
        return api_zone_regions(min_lat, min_lng, max_lat, max_lng)
    if mode == 'departements':
        return api_zone_departements(min_lat, min_lng, max_lat, max_lng)
    if mode == 'communes':
        return api_zone_communes(min_lat, min_lng, max_lat, max_lng)

if __name__ == '__main__':
    app.run(host='0.0.0.0',
            debug='--debug' in sys.argv,
            port=8080,
            threaded=True)
