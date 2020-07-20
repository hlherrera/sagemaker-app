import os

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://spreadsheets.google.com/feeds',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/spreadsheets']

# The ID and range of a sample spreadsheet.
SAMPLE_SPREADSHEET_ID = '1Vk12gCE8vN0J8FntS91bZBC3cIQmgtbv227ua_JloOU'


def inference(req):
    """Shows basic usage of the Sheets API.
    Prints values from a sample spreadsheet.
    """
    print('request:', req)
    sheetName = req['sheet'] or 'prad'
    pp_cell, pp_value = req['pp'].split(':')
    etp_cell, etp_value = req['etp'].split(':')
    cdc_cell, cdc_value = req['cdc'].split(':')
    pmp_cell, pmp_value = req['pmp'].split(':')
    da_cell, da_value = req['da'].split(':')
    cr_cell, cr_value = req['da'].split(':')

    table_row = pp_cell[1:]

    creds = ServiceAccountCredentials.from_json_keyfile_name(
        'credentials.json', SCOPES)
    client = gspread.authorize(creds)
    sh = client.open_by_key(SAMPLE_SPREADSHEET_ID)
    sheet = sh.worksheet(sheetName)

    # update cells
    sheet.update(pp_cell, float(pp_value))
    sheet.update(etp_cell, float(etp_value))
    sheet.update(cdc_cell, float(cdc_value))
    sheet.update(pmp_cell, float(pmp_value))
    sheet.update(da_cell, float(da_value))
    sheet.update(cr_cell, float(cr_value))

    # outout
    LR = sheet.acell('J{}'.format(table_row)).value
    FR = sheet.acell('K{}'.format(table_row)).value
    NR = sheet.acell('M19').value

    return {"lr": LR, "fr": FR, "nr": NR}


if __name__ == '__main__':
    inference({})
