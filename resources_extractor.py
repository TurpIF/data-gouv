import requests
import json
import logging

def is_valid(res):
    white_list = ['csv', 'json', 'txt', 'xls', 'xlsx', 'xml', 'csv ods pdf', 'gzip', 'ods', 'shp', 'tsv']
    if res['format'].lower().strip() in white_list:
        return True
    return False

def get_resources(id):
    base_url = 'http://www.data.gouv.fr/api/3/action/package_show?id=%s'
    url = base_url % id
    ans = requests.get(url)
    if not ans.ok:
        raise IOError('Request not ok')

    content = ans.json()
    if not content:
        raise IOError('No json content')

    if not content['success']:
        raise IOError('Id does not exist')

    resources = list(filter(is_valid, content['result']['resources']))
    for r in resources:
        r['package_id'] = id
    return resources

if __name__ == '__main__':
    logging.root.setLevel(logging.INFO)

    input_filename = './filtered_ids.ls'
    ids = [l.strip() for l in open(input_filename).readlines()]

    resources = []
    for id in ids:
        resources.extend(get_resources(id))
        try:
            res = get_resources(id)
        except Exception as e:
            logging.exception(e)
        else:
            logging.info('Find %d resources for %s' % (len(res), id))
            resources.extend(res)

    # Unify by url
    logging.info('Find a total of %d resources' % len(resources))
    res = {}
    for r in resources:
        res[r['url']] = r
    resources = list(res.values())
    logging.info('Find a total of %d uniq resources' % len(resources))

    output_filename = './all_resources.json'
    import os
    try:
        os.remove(output_filename)
    except FileNotFoundError:
        pass
    json.dump(resources, open(output_filename, 'w'))
