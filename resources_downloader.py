import requests
import json
import logging
import os

def download_resource(res):
    download_path = './downloads'
    try:
        os.mkdir(download_path)
    except FileExistsError:
        pass

    try:
        os.mkdir('%s/%s' % (download_path, res['package_id']))
    except FileExistsError:
        pass

    ans = requests.get(res['url'])
    if not ans.ok:
        raise IOError('Can\'t download file %s' % res['url'])

    dirname = '%s/%s' % (download_path, res['package_id'])
    filename = '%s-%s.%s' % (res['name'], res['id'], res['format'].lower().strip())
    filename = filename.replace('\'', '-')
    filename = filename.replace('/', '-')
    with open(dirname + '/' + filename, 'wb') as f:
        f.write(ans.content)

if __name__ == '__main__':
    logging.root.setLevel(logging.INFO)

    resources_filename = './all_resources.json'
    data = json.load(open(resources_filename))
    for res in data:
        logging.info('Downloading %s resource' % res['name'])
        try:
            download_resource(res)
        except Exception as e:
            logging.exception(e)

