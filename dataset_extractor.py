import requests
import json
import logging

def is_valid(id):
    white_list = ['commissariat', 'police', 'gendarmerie', 'police-gendarmerie-crime-delits-statistiques', 'polices municipales', 'gendarmerie', 'gendarmerie-nationale', 'crime', 'crimes', 'criminalite', 'criminalité', 'delinquance', 'delits', 'insecurite', 'infraction', 'infractions','securite', 'securite-interieure', 'securite-publique']
    for word in id.split('-'):
        if word in white_list:
            return True

    base_url = 'http://www.data.gouv.fr/api/3/action/package_show?id=%s'
    ans = requests.get(base_url % id)
    if not ans.ok:
        return False

    content = ans.json()
    if not content:
        return False

    if not content['success']:
        return False
    result = content['result']

    tags = result['tags']
    for t in tags:
        if t['name'] in white_list or t['display_name'] in white_list:
            return True

    return False

def write_output(s, out):
    out.write(s + '\n')
    out.flush()

if __name__ == '__main__':
    logging.root.setLevel(logging.INFO)

    all_ids = json.load(open('./all_ids.json'))['result']
    import os
    try:
        os.remove('./extracted_ids.ls')
    except FileNotFoundError:
        pass

    output = open('./extracted_ids.ls', mode='w')
    n = 0
    for id in all_ids:
        v = False
        try:
            v = is_valid(id)
        except Exception as e:
            logging.exception(e)

        if v:
            n += 1
            logging.info('%d - Writing %s dataset' % (n, id))
            write_output(id, output)
        else:
            logging.info('Ignoring %s dataset' % id)
