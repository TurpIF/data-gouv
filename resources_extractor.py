import requests
import json
import logging

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

    resources = content['result']['resources']
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
            for r in res:
                r['package_id'] = id
            resources.extend(res)

    output_filename = './all_resources.json'
    json.dump(resources, open(output_filename, 'w'))
